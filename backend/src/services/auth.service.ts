import crypto from 'crypto';
import { prisma } from '../database/client';
import { Role, UserStatus, SkillSource } from '@prisma/client';
import { RegisterDto, AuthUserDto, AuthResponseDto } from '../dto/auth.dto';
import { PasswordUtils } from '../auth/password.utils';
import { TokenUtils, TokenPayload } from '../auth/token.utils';
import { permissionsMap } from '../permissions';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/app-error';

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private mapToAuthUser(
    user: {
      id: string;
      organizationId: string;
      departmentId: string | null;
      email: string;
      firstName: string;
      lastName: string | null;
      phone: string | null;
      avatarUrl: string | null;
      role: Role;
      status: UserStatus;
      emailVerified: boolean;
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      organization?: { name: string } | null;
      department?: { name: string } | null;
      traineeProfile?: {
        id: string;
        designation: string | null;
        bio: string | null;
        interests: string[];
        profileCompletion: number;
      } | null;
      trainerProfile?: {
        id: string;
        designation: string;
        organizationName: string | null;
        bio: string;
        yearsExperience: number;
      } | null;
    },
    permissions: string[],
  ): AuthUserDto {
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

  public async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Resolve organization: use provided or fallback to first active organization
    let organizationId = dto.organizationId;
    if (!organizationId) {
      const defaultOrg = await prisma.organization.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultOrg) {
        throw new BadRequestError('No active organization found to attach user');
      }
      organizationId = defaultOrg.id;
    }

    const passwordHash = await PasswordUtils.hash(dto.password);
    // Public self-registration is strictly restricted to TRAINEE accounts to prevent privilege escalation.
    // Administrative roles (ADMIN, SUPER_ADMIN, TRAINER) must be provisioned through internal governance workflows.
    const assignedRole = Role.TRAINEE;

    // Create user and auto-create corresponding profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          organizationId,
          departmentId: dto.departmentId,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: assignedRole,
          status: UserStatus.APPROVED, // Default to approved for demo / direct register
          emailVerified: true,
        },
        include: {
          organization: { select: { name: true } },
          department: { select: { name: true } },
        },
      });

      if (assignedRole === Role.TRAINEE) {
        await tx.traineeProfile.create({
          data: {
            userId: newUser.id,
            designation: 'Trainee',
            bio: 'Continuous learning member.',
          },
        });
      } else if (assignedRole === Role.TRAINER) {
        await tx.trainerProfile.create({
          data: {
            userId: newUser.id,
            designation: 'Professional Trainer',
            bio: 'Expert instructor.',
            yearsExperience: 1,
          },
        });
      }

      // Log registration in Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: newUser.id,
          newValues: { email: newUser.email, role: newUser.role },
          ipAddress,
          userAgent,
        },
      });

      return newUser;
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

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    const populatedUser = await this.getMe(user.id);

    return {
      accessToken,
      refreshToken,
      user: populatedUser,
    };
  }

  public async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
        traineeProfile: true,
        trainerProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== UserStatus.APPROVED) {
      if (user.status === UserStatus.PENDING) {
        throw new UnauthorizedError('Your account is awaiting administrative approval');
      }
      if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DEACTIVATED) {
        throw new UnauthorizedError('Your account is currently unavailable. Please contact your administrator');
      }
      if (user.status === UserStatus.REJECTED) {
        throw new UnauthorizedError('Your registration request could not be approved');
      }
      throw new UnauthorizedError('Account is not authorized to sign in');
    }

    const passwordMatch = await PasswordUtils.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Record failed login attempt in audit log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: user.id,
          newValues: { reason: 'Password mismatch' },
          ipAddress,
          userAgent,
        },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record successful login audit
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      },
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

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.mapToAuthUser(user, permissions),
    };
  }

  public async refreshAccessToken(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    const tokenHash = this.hashToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            organization: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

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

    // Rotate refresh tokens: revoke old, persist new in transaction
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: user.id,
          expiresAt,
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return { accessToken, newRefreshToken };
  }

  public async logout(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async getMe(userId: string): Promise<AuthUserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
        traineeProfile: true,
        trainerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Authenticated user profile not found');
    }

    const permissions = permissionsMap[user.role] || [];
    return this.mapToAuthUser(user, permissions);
  }

  public async getOnboardingMeta(): Promise<{
    departments: Array<{ id: string; name: string; code: string; description: string | null }>;
    skills: Array<{ id: string; name: string; code: string; category: string | null }>;
  }> {
    const excludedGenericDepts = ['Technology & Engineering', 'Human Resources', 'Training & Development'];
    const departments = await prisma.department.findMany({
      where: {
        name: { notIn: excludedGenericDepts },
      },
      select: { id: true, name: true, code: true, description: true },
      orderBy: { name: 'asc' },
    });

    const excludedGenericSkills = ['Java', 'Python', 'Machine Learning', 'Cloud Computing', 'SQL & PostgreSQL'];
    const skills = await prisma.skill.findMany({
      where: {
        name: { notIn: excludedGenericSkills },
      },
      select: { id: true, name: true, code: true, category: true },
      orderBy: { name: 'asc' },
    });
    return { departments, skills };
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { traineeProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update User details if provided
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName ? { lastName: data.lastName } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
      },
    });

    // Upsert Trainee Profile with 100% completion
    await prisma.traineeProfile.upsert({
      where: { userId },
      create: {
        userId,
        designation: data.designation,
        bio: data.bio || null,
        interests: data.interests || [],
        profileCompletion: 100,
      },
      update: {
        designation: data.designation,
        bio: data.bio || null,
        interests: data.interests || [],
        profileCompletion: 100,
      },
    });

    // Connect user skills
    if (data.skills && data.skills.length > 0) {
      for (const skillItem of data.skills) {
        let skill = await prisma.skill.findFirst({
          where: {
            OR: [{ id: skillItem }, { name: { equals: skillItem, mode: 'insensitive' } }],
          },
        });

        if (!skill) {
          skill = await prisma.skill.create({
            data: {
              name: skillItem,
              code: `SKILL-${skillItem.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`,
              category: 'General',
            },
          });
        }

        const existingUserSkill = await prisma.userSkill.findFirst({
          where: { userId, skillId: skill.id },
        });

        if (!existingUserSkill) {
          await prisma.userSkill.create({
            data: {
              userId,
              skillId: skill.id,
              proficiencyLevel: 2,
              source: SkillSource.PROFILE,
            },
          });
        }
      }
    }

    return this.getMe(userId);
  }
}

export default AuthService;
