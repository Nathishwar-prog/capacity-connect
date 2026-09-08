import prisma from '../database/client';
import {
  Qualification,
  WorkExperience,
  UserSkill,
  Certificate,
  Skill,
  Prisma,
  SkillSource,
  CertificateStatus,
} from '@prisma/client';

export interface UpdateTraineeProfileData {
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  bio?: string | null;
  interests?: string[];
  profileCompletion?: number;
}

export interface CreateQualificationData {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string | null;
}

export interface UpdateQualificationData {
  degree?: string;
  fieldOfStudy?: string;
  institution?: string;
  startDate?: Date;
  endDate?: Date | null;
  description?: string | null;
}

export interface CreateWorkExperienceData {
  companyName: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent?: boolean;
  description?: string | null;
}

export interface UpdateWorkExperienceData {
  companyName?: string;
  jobTitle?: string;
  startDate?: Date;
  endDate?: Date | null;
  isCurrent?: boolean;
  description?: string | null;
}

export interface CreateCertificateData {
  title: string;
  issuingOrganization: string;
  credentialId?: string | null;
  issueDate: Date;
  expiryDate?: Date | null;
  certificateUrl?: string | null;
}

export interface AuditLogPayload {
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

export class ProfileRepository {
  /**
   * Fetch complete trainee profile including personal info, traineeProfile, qualifications,
   * experience, skills, and certificates.
   */
  public async getTraineeProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        traineeProfile: true,
        qualifications: { orderBy: { startDate: 'desc' } },
        workExperiences: { orderBy: { startDate: 'desc' } },
        userSkills: {
          include: { skill: true },
          orderBy: { createdAt: 'desc' },
        },
        certificates: { orderBy: { issueDate: 'desc' } },
      },
    });

    if (!user) {
      return null;
    }

    // Auto-initialize empty TraineeProfile if missing
    if (!user.traineeProfile) {
      const initialProfile = await prisma.traineeProfile.create({
        data: {
          userId: user.id,
          designation: null,
          bio: null,
          interests: [],
          profileCompletion: 20,
        },
      });
      return {
        ...user,
        traineeProfile: initialProfile,
      };
    }

    return user;
  }

  /**
   * Update personal info on User and profile fields on TraineeProfile atomically
   */
  public async updateTraineeProfile(userId: string, data: UpdateTraineeProfileData) {
    return prisma.$transaction(async (tx) => {
      // 1. Update User personal info if any provided
      const userUpdate: Prisma.UserUpdateInput = {};
      if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) userUpdate.lastName = data.lastName;
      if (data.phone !== undefined) userUpdate.phone = data.phone;
      if (data.avatarUrl !== undefined) userUpdate.avatarUrl = data.avatarUrl;
      if (data.departmentId !== undefined) {
        userUpdate.department = data.departmentId
          ? { connect: { id: data.departmentId } }
          : { disconnect: true };
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        });
      }

      // 2. Upsert TraineeProfile
      const profileUpdate: Prisma.TraineeProfileUpdateInput = {};
      if (data.designation !== undefined) profileUpdate.designation = data.designation;
      if (data.bio !== undefined) profileUpdate.bio = data.bio;
      if (data.interests !== undefined) profileUpdate.interests = data.interests;
      if (data.profileCompletion !== undefined)
        profileUpdate.profileCompletion = data.profileCompletion;

      await tx.traineeProfile.upsert({
        where: { userId },
        create: {
          userId,
          designation: data.designation || null,
          bio: data.bio || null,
          interests: data.interests || [],
          profileCompletion: data.profileCompletion ?? 20,
        },
        update: profileUpdate,
      });

      // 3. Return refreshed complete profile
      return tx.user.findUnique({
        where: { id: userId },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          traineeProfile: true,
          qualifications: { orderBy: { startDate: 'desc' } },
          workExperiences: { orderBy: { startDate: 'desc' } },
          userSkills: {
            include: { skill: true },
            orderBy: { createdAt: 'desc' },
          },
          certificates: { orderBy: { issueDate: 'desc' } },
        },
      });
    });
  }

  // ==============================================================================
  // QUALIFICATIONS
  // ==============================================================================

  public async getQualifications(userId: string): Promise<Qualification[]> {
    return prisma.qualification.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  public async getQualificationById(id: string, userId: string): Promise<Qualification | null> {
    return prisma.qualification.findFirst({
      where: { id, userId },
    });
  }

  public async createQualification(
    userId: string,
    data: CreateQualificationData,
  ): Promise<Qualification> {
    return prisma.qualification.create({
      data: {
        userId,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        institution: data.institution,
        startDate: data.startDate,
        endDate: data.endDate || null,
        description: data.description || null,
      },
    });
  }

  public async updateQualification(
    id: string,
    userId: string,
    data: UpdateQualificationData,
  ): Promise<Qualification | null> {
    const existing = await this.getQualificationById(id, userId);
    if (!existing) {
      return null;
    }

    return prisma.qualification.update({
      where: { id },
      data: {
        ...(data.degree !== undefined && { degree: data.degree }),
        ...(data.fieldOfStudy !== undefined && { fieldOfStudy: data.fieldOfStudy }),
        ...(data.institution !== undefined && { institution: data.institution }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  public async deleteQualification(id: string, userId: string): Promise<Qualification | null> {
    const existing = await this.getQualificationById(id, userId);
    if (!existing) {
      return null;
    }

    return prisma.qualification.delete({
      where: { id },
    });
  }

  // ==============================================================================
  // WORK EXPERIENCE
  // ==============================================================================

  public async getWorkExperiences(userId: string): Promise<WorkExperience[]> {
    return prisma.workExperience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  public async getWorkExperienceById(id: string, userId: string): Promise<WorkExperience | null> {
    return prisma.workExperience.findFirst({
      where: { id, userId },
    });
  }

  public async createWorkExperience(
    userId: string,
    data: CreateWorkExperienceData,
  ): Promise<WorkExperience> {
    return prisma.workExperience.create({
      data: {
        userId,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isCurrent: data.isCurrent ?? false,
        description: data.description || null,
      },
    });
  }

  public async updateWorkExperience(
    id: string,
    userId: string,
    data: UpdateWorkExperienceData,
  ): Promise<WorkExperience | null> {
    const existing = await this.getWorkExperienceById(id, userId);
    if (!existing) {
      return null;
    }

    return prisma.workExperience.update({
      where: { id },
      data: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  public async deleteWorkExperience(id: string, userId: string): Promise<WorkExperience | null> {
    const existing = await this.getWorkExperienceById(id, userId);
    if (!existing) {
      return null;
    }

    return prisma.workExperience.delete({
      where: { id },
    });
  }

  // ==============================================================================
  // SKILLS
  // ==============================================================================

  public async getUserSkills(userId: string): Promise<UserSkill[]> {
    return prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findOrCreateSkill(nameOrId: string): Promise<Skill> {
    // 1. Check if nameOrId matches an existing Skill ID or Name
    let skill = await prisma.skill.findFirst({
      where: {
        OR: [{ id: nameOrId }, { name: { equals: nameOrId, mode: 'insensitive' } }],
      },
    });

    if (!skill) {
      const code = `SKILL-${nameOrId
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10)}-${Date.now().toString().slice(-4)}`;

      skill = await prisma.skill.create({
        data: {
          name: nameOrId,
          code,
          category: 'Domain Competency',
        },
      });
    }

    return skill;
  }

  public async addUserSkill(
    userId: string,
    skillId: string,
    proficiencyLevel: number = 1,
    yearsExperience?: number | null,
    source: SkillSource = SkillSource.PROFILE,
  ): Promise<UserSkill> {
    return prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      create: {
        userId,
        skillId,
        proficiencyLevel,
        yearsExperience: yearsExperience ?? null,
        source,
      },
      update: {
        proficiencyLevel,
        yearsExperience: yearsExperience ?? null,
      },
      include: {
        skill: true,
      },
    });
  }

  public async removeUserSkill(userId: string, skillId: string): Promise<boolean> {
    const existing = await prisma.userSkill.findFirst({
      where: {
        userId,
        OR: [{ skillId }, { id: skillId }],
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.userSkill.delete({
      where: { id: existing.id },
    });

    return true;
  }

  public async getAvailableSkills(options: {
    search?: string;
    category?: string;
    skip?: number;
    take?: number;
  }): Promise<{ skills: Skill[]; total: number }> {
    const where: Prisma.SkillWhereInput = {};

    if (options.search && options.search.trim().length > 0) {
      where.OR = [
        { name: { contains: options.search.trim(), mode: 'insensitive' } },
        { code: { contains: options.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (options.category) {
      where.category = { equals: options.category, mode: 'insensitive' };
    }

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 50,
        orderBy: { name: 'asc' },
      }),
      prisma.skill.count({ where }),
    ]);

    return { skills, total };
  }

  // ==============================================================================
  // CERTIFICATES
  // ==============================================================================

  public async getCertificates(userId: string): Promise<Certificate[]> {
    return prisma.certificate.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
    });
  }

  public async getCertificateById(id: string, userId: string): Promise<Certificate | null> {
    return prisma.certificate.findFirst({
      where: { id, userId },
    });
  }

  public async createCertificate(
    userId: string,
    data: CreateCertificateData,
  ): Promise<Certificate> {
    return prisma.certificate.create({
      data: {
        userId,
        title: data.title,
        issuingOrganization: data.issuingOrganization,
        credentialId: data.credentialId || null,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || null,
        certificateUrl: data.certificateUrl || null,
        verificationStatus: CertificateStatus.PENDING,
      },
    });
  }

  public async deleteCertificate(id: string, userId: string): Promise<Certificate | null> {
    const existing = await this.getCertificateById(id, userId);
    if (!existing) {
      return null;
    }

    return prisma.certificate.delete({
      where: { id },
    });
  }

  // ==============================================================================
  // AUDIT LOG
  // ==============================================================================

  public async createAuditLog(data: AuditLogPayload): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: data.organizationId || null,
          userId: data.userId || null,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId || null,
          oldValues: data.oldValues ? (data.oldValues as Prisma.InputJsonValue) : Prisma.DbNull,
          newValues: data.newValues ? (data.newValues as Prisma.InputJsonValue) : Prisma.DbNull,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch {
      // Safe fallback - avoid failing user operations if audit logging has an issue
    }
  }
}
