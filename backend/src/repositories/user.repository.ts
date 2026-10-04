import crypto from 'crypto';
import prisma from '../database/client';
import { User, RefreshToken, Role, UserStatus, Prisma } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

export interface UserFilterOptions {
  search?: string;
  role?: Role;
  status?: UserStatus;
  departmentId?: string;
  department?: string;
  skip?: number;
  take?: number;
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

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(skip?: number, take?: number): Promise<User[]>;
  findPaginatedUsers(options: UserFilterOptions): Promise<{ users: User[]; total: number }>;
  create(data: CreateUserDto & { passwordHash: string }): Promise<User>;
  update(id: string, data: UpdateUserDto & { passwordHash?: string }): Promise<User>;
  updateUserStatus(id: string, status: UserStatus): Promise<User>;
  updateUserRole(id: string, role: Role): Promise<User>;
  delete(id: string): Promise<User>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshToken>;
  findRefreshToken(tokenHash: string): Promise<(RefreshToken & { user: User }) | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeUserRefreshTokens(userId: string): Promise<void>;
  createAuditLog(data: CreateAuditLogData): Promise<void>;
}

export class UserRepository implements IUserRepository {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        traineeProfile: true,
        trainerProfile: true,
      },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        traineeProfile: true,
        trainerProfile: true,
      },
    });
  }

  public async findAll(skip: number = 0, take: number = 20): Promise<User[]> {
    return prisma.user.findMany({
      skip,
      take,
      include: {
        department: true,
        traineeProfile: true,
        trainerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findPaginatedUsers(
    options: UserFilterOptions,
  ): Promise<{ users: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {};

    // Search by firstName, lastName, or email (case-insensitive)
    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (options.role) {
      where.role = options.role;
    }

    // Status filter
    if (options.status) {
      where.status = options.status;
    }

    // Department filter: by ID or relational code/name match
    if (options.departmentId) {
      where.departmentId = options.departmentId;
    } else if (options.department && options.department.trim().length > 0) {
      const dept = options.department.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dept);
      if (isUuid) {
        where.departmentId = dept;
      } else {
        where.department = {
          OR: [
            { code: { equals: dept, mode: 'insensitive' } },
            { name: { contains: dept, mode: 'insensitive' } },
          ],
        };
      }
    }

    const skip = options.skip ?? 0;
    const take = options.take ?? 20;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        include: {
          department: true,
          traineeProfile: true,
          trainerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  public async create(data: CreateUserDto & { passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || Role.TRAINEE,
        status: data.status || UserStatus.PENDING,
      },
    });
  }

  public async update(id: string, data: UpdateUserDto & { passwordHash?: string }): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (data.departmentId !== undefined) {
      updateData.departmentId = data.departmentId;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.passwordHash !== undefined) {
      updateData.passwordHash = data.passwordHash;
    }
    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  public async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const data: Prisma.UserUpdateInput = { status };
    if (status === UserStatus.APPROVED) {
      data.emailVerified = true;
    }
    return prisma.user.update({
      where: { id },
      data,
      include: {
        department: true,
        traineeProfile: true,
        trainerProfile: true,
      },
    });
  }

  public async updateUserRole(id: string, role: Role): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  public async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  public async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const tokenHash = this.hashToken(token);
    return prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  public async findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null> {
    const tokenHash = this.hashToken(token);
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async createAuditLog(data: CreateAuditLogData): Promise<void> {
    let validUserId = data.userId;
    if (validUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: validUserId },
        select: { id: true },
      });
      if (!userExists) {
        validUserId = null;
      }
    }

    await prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: validUserId,
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
}

export default UserRepository;
