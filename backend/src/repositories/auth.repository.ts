import { prisma } from '../database/client';
import {
  User,
  RefreshToken,
  Role,
  UserStatus,
  SkillSource,
  Prisma,
  Department,
  Skill,
} from '@prisma/client';

export type UserWithRelations = User & {
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
};

export type RefreshTokenWithUser = RefreshToken & {
  user: User & {
    organization?: { name: string } | null;
    department?: { name: string } | null;
  };
};

export interface CreatePendingUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  organizationId: string;
  departmentId?: string;
  role?: Role;
  ipAddress?: string;
  userAgent?: string;
}

export interface SaveRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAuditLogData {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<UserWithRelations | null>;
  findById(id: string): Promise<UserWithRelations | null>;
  findDefaultOrganization(): Promise<{ id: string; name: string } | null>;
  createPendingUser(data: CreatePendingUserData): Promise<UserWithRelations>;
  saveRefreshToken(data: SaveRefreshTokenData): Promise<RefreshToken>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  revokeRefreshToken(id: string): Promise<void>;
  revokeRefreshTokenByHash(tokenHash: string): Promise<void>;
  rotateRefreshToken(oldTokenId: string, newTokenData: SaveRefreshTokenData): Promise<RefreshToken>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;
  updateEmailVerified(userId: string, emailVerified: boolean): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  createAuditLog(data: CreateAuditLogData): Promise<void>;
  getDepartmentsExcluding(excludedNames: string[]): Promise<Department[]>;
  getSkillsExcluding(excludedNames: string[]): Promise<Skill[]>;
  updateUser(
    userId: string,
    data: { firstName?: string; lastName?: string; departmentId?: string },
  ): Promise<User>;
  upsertTraineeProfile(
    userId: string,
    data: {
      designation: string;
      bio?: string | null;
      interests: string[];
      profileCompletion: number;
    },
  ): Promise<void>;
  findOrCreateSkill(name: string): Promise<Skill>;
  ensureUserSkill(userId: string, skillId: string, source: SkillSource): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  public async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
        traineeProfile: {
          select: {
            id: true,
            designation: true,
            bio: true,
            interests: true,
            profileCompletion: true,
          },
        },
        trainerProfile: {
          select: {
            id: true,
            designation: true,
            organizationName: true,
            bio: true,
            yearsExperience: true,
          },
        },
      },
    });
  }

  public async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
        traineeProfile: {
          select: {
            id: true,
            designation: true,
            bio: true,
            interests: true,
            profileCompletion: true,
          },
        },
        trainerProfile: {
          select: {
            id: true,
            designation: true,
            organizationName: true,
            bio: true,
            yearsExperience: true,
          },
        },
      },
    });
  }

  public async findDefaultOrganization(): Promise<{ id: string; name: string } | null> {
    return prisma.organization.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async createPendingUser(data: CreatePendingUserData): Promise<UserWithRelations> {
    const assignedRole = data.role || Role.TRAINEE;

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: assignedRole,
          status: UserStatus.PENDING, // Strictly enforces required PENDING approval stage
          emailVerified: false,
        },
        include: {
          organization: { select: { name: true } },
          department: { select: { name: true } },
          traineeProfile: true,
          trainerProfile: true,
        },
      });

      let traineeProfile = null;
      let trainerProfile = null;

      if (assignedRole === Role.TRAINEE) {
        traineeProfile = await tx.traineeProfile.create({
          data: {
            userId: newUser.id,
            designation: 'Trainee',
            bio: 'Continuous learning member.',
          },
        });
      } else if (assignedRole === Role.TRAINER) {
        trainerProfile = await tx.trainerProfile.create({
          data: {
            userId: newUser.id,
            designation: 'Professional Trainer',
            bio: 'Expert instructor.',
            yearsExperience: 1,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: data.organizationId,
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: newUser.id,
          newValues: {
            email: newUser.email,
            role: newUser.role,
            status: UserStatus.PENDING,
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      return {
        ...newUser,
        traineeProfile,
        trainerProfile,
      };
    });
  }

  public async saveRefreshToken(data: SaveRefreshTokenData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        tokenHash: data.tokenHash,
        userId: data.userId,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  public async findRefreshToken(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    return prisma.refreshToken.findUnique({
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
  }

  public async revokeRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async rotateRefreshToken(
    oldTokenId: string,
    newTokenData: SaveRefreshTokenData,
  ): Promise<RefreshToken> {
    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      });

      return tx.refreshToken.create({
        data: {
          tokenHash: newTokenData.tokenHash,
          userId: newTokenData.userId,
          expiresAt: newTokenData.expiresAt,
          ipAddress: newTokenData.ipAddress,
          userAgent: newTokenData.userAgent,
        },
      });
    });
  }

  public async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async updateEmailVerified(userId: string, emailVerified: boolean): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified },
    });
  }

  public async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  public async createAuditLog(data: CreateAuditLogData): Promise<void> {
    await prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  public async getDepartmentsExcluding(excludedNames: string[]): Promise<Department[]> {
    return prisma.department.findMany({
      where: {
        name: { notIn: excludedNames },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async getSkillsExcluding(excludedNames: string[]): Promise<Skill[]> {
    return prisma.skill.findMany({
      where: {
        name: { notIn: excludedNames },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async updateUser(
    userId: string,
    data: { firstName?: string; lastName?: string; departmentId?: string },
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  public async upsertTraineeProfile(
    userId: string,
    data: {
      designation: string;
      bio?: string | null;
      interests: string[];
      profileCompletion: number;
    },
  ): Promise<void> {
    await prisma.traineeProfile.upsert({
      where: { userId },
      create: {
        userId,
        designation: data.designation,
        bio: data.bio || null,
        interests: data.interests || [],
        profileCompletion: data.profileCompletion,
      },
      update: {
        designation: data.designation,
        bio: data.bio || null,
        interests: data.interests || [],
        profileCompletion: data.profileCompletion,
      },
    });
  }

  public async findOrCreateSkill(name: string): Promise<Skill> {
    let skill = await prisma.skill.findFirst({
      where: {
        OR: [{ id: name }, { name: { equals: name, mode: 'insensitive' } }],
      },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name,
          code: `SKILL-${name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 10)}`,
          category: 'General',
        },
      });
    }

    return skill;
  }

  public async ensureUserSkill(
    userId: string,
    skillId: string,
    source: SkillSource = SkillSource.PROFILE,
  ): Promise<void> {
    const existing = await prisma.userSkill.findFirst({
      where: { userId, skillId },
    });

    if (!existing) {
      await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          proficiencyLevel: 2,
          source,
        },
      });
    }
  }
}

export default AuthRepository;
