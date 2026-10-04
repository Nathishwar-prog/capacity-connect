import crypto from 'crypto';
import { Role, UserStatus, SkillSource } from '@prisma/client';
import { RegisterDto, AuthUserDto, AuthResponseDto, RegisterResponseDto } from '../dto/auth.dto';
import { PasswordUtils } from '../auth/password.utils';
import { TokenUtils, TokenPayload } from '../auth/token.utils';
import { permissionsMap } from '../permissions';
import { mailService } from '../mails';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/app-error';
import {
  IAuthRepository,
  AuthRepository,
  UserWithRelations,
} from '../repositories/auth.repository';

export class AuthService {
  private authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository = new AuthRepository()) {
    this.authRepository = authRepository;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private mapToAuthUser(user: UserWithRelations, permissions: string[]): AuthUserDto {
    return {
      id: user.id,
      organizationId: user.organizationId,
      organizationName: user.organization?.name,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      permissions,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      traineeProfile: user.traineeProfile
        ? {
            id: user.traineeProfile.id,
            designation: user.traineeProfile.designation,
            bio: user.traineeProfile.bio,
            interests: user.traineeProfile.interests,
            profileCompletion: user.traineeProfile.profileCompletion,
          }
        : null,
      trainerProfile: user.trainerProfile
        ? {
            id: user.trainerProfile.id,
            designation: user.trainerProfile.designation,
            organizationName: user.trainerProfile.organizationName,
            bio: user.trainerProfile.bio,
            yearsExperience: user.trainerProfile.yearsExperience,
          }
        : null,
    };
  }

  /**
   * Public Self-Registration (Signup)
   *
   * Required Flow:
   * Signup -> PENDING -> Admin Approval -> Login -> Access Token -> Refresh Token
   *
   * A newly registered account is strictly placed into PENDING state.
   * NO access or refresh tokens are issued upon registration.
   */
  public async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RegisterResponseDto> {
    const existing = await this.authRepository.findByEmail(dto.email);

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Resolve organization: use provided or fallback to first active organization
    let organizationId = dto.organizationId;
    if (!organizationId) {
      const defaultOrg = await this.authRepository.findDefaultOrganization();
      if (!defaultOrg) {
        throw new BadRequestError('No active organization found to attach user');
      }
      organizationId = defaultOrg.id;
    }

    if (dto.role && dto.role !== Role.TRAINEE && dto.role !== Role.TRAINER) {
      throw new BadRequestError(
        'Public self-registration is strictly restricted to Trainee and Trainer accounts. Administrative roles must be provisioned by an administrator.',
      );
    }

    const passwordHash = await PasswordUtils.hash(dto.password);
    // Assign requested role (TRAINER or TRAINEE, default TRAINEE)
    const assignedRole = dto.role === Role.TRAINER ? Role.TRAINER : Role.TRAINEE;

    // Create user in PENDING status requiring administrator verification and approval
    const user = await this.authRepository.createPendingUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      organizationId,
      departmentId: dto.departmentId,
      role: assignedRole,
      status: UserStatus.PENDING,
      ipAddress,
      userAgent,
    });

    // Generate Email Verification Token & Dispatch Verification Email
    try {
      const verificationToken = TokenUtils.generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
      });

      const verificationSubject = 'Welcome to Capacity Connect — Verify Your Email';
      const verificationBody = `
        <h2>Welcome to Capacity Connect, ${user.firstName}!</h2>
        <p>Your ${assignedRole === Role.TRAINER ? 'Trainer' : 'Trainee'} account for the MoES/IMD Digital Capacity Building Portal is pending administrative approval.</p>
        <p>Please verify your official email address using the following token:</p>
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all;">
          ${verificationToken}
        </div>
        <p>Once verified and approved by an administrator, you will be able to sign in.</p>
      `;

      await mailService.sendEmail(user.email, verificationSubject, verificationBody);
    } catch (mailError) {
      // Email delivery failure should not roll back the user record, but is safely handled
      await this.authRepository.createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'VERIFICATION_EMAIL_DISPATCH_FAILED',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
    }

    const permissions = permissionsMap[user.role] || [];
    return {
      message:
        'Registration successful! Your account is pending administrative approval. You will be able to sign in once an administrator approves your account.',
      requiresApproval: true,
      user: this.mapToAuthUser(user, permissions),
    };
  }

  /**
   * User Authentication (Login)
   *
   * Validates credentials and strictly enforces account status (must be APPROVED).
   */
  public async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify Password Hash
    const passwordMatch = await PasswordUtils.compare(password, user.passwordHash);
    if (!passwordMatch) {
      await this.authRepository.createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        newValues: { reason: 'Password mismatch' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Strictly enforce lifecycle status: Only APPROVED users may login
    if (user.status !== UserStatus.APPROVED) {
      if (user.status === UserStatus.PENDING) {
        await this.authRepository.createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: 'LOGIN_BLOCKED_PENDING',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedError('Your account is awaiting administrative approval');
      }
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DEACTIVATED) {
        await this.authRepository.createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: 'LOGIN_BLOCKED_INACTIVE',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedError(
          'Your account is currently unavailable. Please contact your administrator',
        );
      }
      if (user.status === UserStatus.REJECTED) {
        await this.authRepository.createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: 'LOGIN_BLOCKED_REJECTED',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedError('Your registration request could not be approved');
      }
      throw new UnauthorizedError('Account is not authorized to sign in');
    }

    // Update lastLoginAt
    await this.authRepository.updateLastLogin(user.id);

    // Record successful login audit
    await this.authRepository.createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const permissions = permissionsMap[user.role] || [];
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const accessToken = TokenUtils.generateAccessToken(tokenPayload);
    const refreshToken = TokenUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.saveRefreshToken({
      tokenHash,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: this.mapToAuthUser(user, permissions),
    };
  }

  /**
   * Session Management: Refresh Token Rotation
   */
  public async refreshAccessToken(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    const tokenHash = this.hashToken(token);

    const storedToken = await this.authRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired or been revoked');
    }

    const user = storedToken.user;
    if (!user || user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedError('User account is inactive or not approved');
    }

    const permissions = permissionsMap[user.role] || [];
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const accessToken = TokenUtils.generateAccessToken(tokenPayload);
    const newRefreshToken = TokenUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Rotate refresh tokens: revoke old, persist new
    await this.authRepository.rotateRefreshToken(storedToken.id, {
      tokenHash: newTokenHash,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return { accessToken, newRefreshToken };
  }

  /**
   * Session Management: Logout & Token Revocation
   */
  public async logout(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.authRepository.revokeRefreshTokenByHash(tokenHash);
  }

  /**
   * Fetch Current Authenticated User Profile
   */
  public async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('Authenticated user profile not found');
    }

    const permissions = permissionsMap[user.role] || [];
    return this.mapToAuthUser(user, permissions);
  }

  /**
   * Email Verification
   */
  public async verifyEmail(token: string): Promise<{ message: string }> {
    let payload;
    try {
      payload = TokenUtils.verifyEmailVerificationToken(token);
    } catch (err) {
      throw new BadRequestError('Email verification token is invalid or has expired');
    }

    const user = await this.authRepository.findById(payload.userId);
    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      throw new BadRequestError('Verification token does not match any registered account');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.authRepository.updateEmailVerified(user.id, true);

    await this.authRepository.createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'User',
      entityId: user.id,
      newValues: { emailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }

  /**
   * Resend Email Verification Token
   */
  public async resendVerification(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(email);

    // Generic response to protect against account enumeration
    const genericResponse = {
      message:
        'If an account associated with this email exists, a verification email has been sent.',
    };

    if (!user || user.emailVerified) {
      return genericResponse;
    }

    try {
      const verificationToken = TokenUtils.generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
      });

      const verificationSubject = 'Verify Your Email — Capacity Connect';
      const verificationBody = `
        <h2>Hello ${user.firstName},</h2>
        <p>A new email verification request was initiated for your Capacity Connect account.</p>
        <p>Please verify your email address using the following verification token:</p>
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; word-break: break-all;">
          ${verificationToken}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This token is valid for 24 hours.</p>
      `;

      await mailService.sendEmail(user.email, verificationSubject, verificationBody);

      await this.authRepository.createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'VERIFICATION_EMAIL_RESENT',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
    } catch (mailError) {
      // Safe logging without breaking client flow
    }

    return genericResponse;
  }

  public async getOnboardingMeta(): Promise<{
    departments: Array<{ id: string; name: string; code: string; description: string | null }>;
    skills: Array<{ id: string; name: string; code: string; category: string | null }>;
  }> {
    const excludedGenericDepts = [
      'Technology & Engineering',
      'Human Resources',
      'Training & Development',
    ];
    const departments = await this.authRepository.getDepartmentsExcluding(excludedGenericDepts);

    const excludedGenericSkills = [
      'Java',
      'Python',
      'Machine Learning',
      'Cloud Computing',
      'SQL & PostgreSQL',
    ];
    const skills = await this.authRepository.getSkillsExcluding(excludedGenericSkills);

    return {
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
      })),
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
      })),
    };
  }

  public async submitTraineeOnboarding(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      departmentId?: string;
      designation: string;
      skills: string[];
      interests: string[];
      bio?: string;
    },
  ): Promise<AuthUserDto> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update User details if provided
    await this.authRepository.updateUser(userId, {
      ...(data.firstName ? { firstName: data.firstName } : {}),
      ...(data.lastName ? { lastName: data.lastName } : {}),
      ...(data.departmentId ? { departmentId: data.departmentId } : {}),
    });

    // Upsert Trainee Profile with 100% completion
    await this.authRepository.upsertTraineeProfile(userId, {
      designation: data.designation,
      bio: data.bio || null,
      interests: data.interests || [],
      profileCompletion: 100,
    });

    // Connect user skills
    if (data.skills && data.skills.length > 0) {
      for (const skillItem of data.skills) {
        const skill = await this.authRepository.findOrCreateSkill(skillItem);
        await this.authRepository.ensureUserSkill(userId, skill.id, SkillSource.PROFILE);
      }
    }

    return this.getMe(userId);
  }
}

export default AuthService;
