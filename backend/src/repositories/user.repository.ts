import crypto from 'crypto';
import prisma from '../database/client';
import { User, RefreshToken, Role, UserStatus } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(skip?: number, take?: number): Promise<User[]>;
  create(data: CreateUserDto & { passwordHash: string }): Promise<User>;
  update(id: string, data: UpdateUserDto & { passwordHash?: string }): Promise<User>;
  delete(id: string): Promise<User>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeUserRefreshTokens(userId: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  public async findAll(skip: number = 0, take: number = 20): Promise<User[]> {
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
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
}

export default UserRepository;
