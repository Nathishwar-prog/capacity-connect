import prisma from '../database/client';
import { Qualification, WorkExperience, Certificate, UserSkill } from '@prisma/client';

export class ProfessionalProfileRepository {
  public async findFullProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        organization: true,
        traineeProfile: true,
        qualifications: {
          orderBy: { startDate: 'desc' },
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
        },
        userSkills: {
          include: { skill: true },
        },
        certificates: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });
  }

  public async updateBasicInfo(
    userId: string,
    userData: {
      firstName?: string;
      lastName?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    },
    profileData: {
      designation?: string | null;
      bio?: string | null;
      profileCompletion?: number;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: userData,
        include: {
          department: true,
          organization: true,
        },
      });

      const profile = await tx.traineeProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...profileData,
        },
        update: profileData,
      });

      return { user, profile };
    });
  }

  public async addQualification(
    userId: string,
    data: {
      degree: string;
      fieldOfStudy: string;
      institution: string;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Qualification> {
    return prisma.qualification.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  public async updateQualification(
    userId: string,
    qualificationId: string,
    data: {
      degree?: string;
      fieldOfStudy?: string;
      institution?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
    },
  ): Promise<Qualification> {
    // Check ownership
    const existing = await prisma.qualification.findFirst({
      where: { id: qualificationId, userId },
    });
    if (!existing) {
      throw new Error('Qualification not found or unauthorized');
    }

    return prisma.qualification.update({
      where: { id: qualificationId },
      data,
    });
  }

  public async deleteQualification(userId: string, qualificationId: string): Promise<Qualification> {
    const existing = await prisma.qualification.findFirst({
      where: { id: qualificationId, userId },
    });
    if (!existing) {
      throw new Error('Qualification not found or unauthorized');
    }

    return prisma.qualification.delete({
      where: { id: qualificationId },
    });
  }

  public async addWorkExperience(
    userId: string,
    data: {
      companyName: string;
      jobTitle: string;
      description?: string | null;
      startDate: Date;
      endDate?: Date | null;
      isCurrent: boolean;
    },
  ): Promise<WorkExperience> {
    return prisma.workExperience.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  public async updateWorkExperience(
    userId: string,
    experienceId: string,
    data: {
      companyName?: string;
      jobTitle?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date | null;
      isCurrent?: boolean;
    },
  ): Promise<WorkExperience> {
    const existing = await prisma.workExperience.findFirst({
      where: { id: experienceId, userId },
    });
    if (!existing) {
      throw new Error('Work experience not found or unauthorized');
    }

    return prisma.workExperience.update({
      where: { id: experienceId },
      data,
    });
  }

  public async deleteWorkExperience(userId: string, experienceId: string): Promise<WorkExperience> {
    const existing = await prisma.workExperience.findFirst({
      where: { id: experienceId, userId },
    });
    if (!existing) {
      throw new Error('Work experience not found or unauthorized');
    }

    return prisma.workExperience.delete({
      where: { id: experienceId },
    });
  }

  public async syncSkills(userId: string, skillNames: string[]): Promise<UserSkill[]> {
    return prisma.$transaction(async (tx) => {
      // Find or create skills in taxonomy
      const skillRecords = await Promise.all(
        skillNames.map(async (name) => {
          const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          return tx.skill.upsert({
            where: { code },
            create: {
              name,
              code,
              category: 'METEOROLOGY',
            },
            update: { name },
          });
        }),
      );

      // Remove current skills not in the list
      const targetSkillIds = skillRecords.map((s) => s.id);
      await tx.userSkill.deleteMany({
        where: {
          userId,
          skillId: { notIn: targetSkillIds },
        },
      });

      // Upsert skills for user
      await Promise.all(
        skillRecords.map((skill) =>
          tx.userSkill.upsert({
            where: {
              userId_skillId: {
                userId,
                skillId: skill.id,
              },
            },
            create: {
              userId,
              skillId: skill.id,
              proficiencyLevel: 2,
            },
            update: {},
          }),
        ),
      );

      return tx.userSkill.findMany({
        where: { userId },
        include: { skill: true },
      });
    });
  }

  public async updateInterests(userId: string, interests: string[]) {
    return prisma.traineeProfile.upsert({
      where: { userId },
      create: {
        userId,
        interests,
      },
      update: {
        interests,
      },
    });
  }

  public async findCertificates(userId: string): Promise<Certificate[]> {
    return prisma.certificate.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
    });
  }
}
