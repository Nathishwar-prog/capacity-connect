import prisma from '../database/client';
import { NotFoundError } from '../errors/app-error';

export interface RoleCompetencyItemDto {
  competencyId: string;
  name: string;
  code: string;
  category: string | null;
  description: string | null;
  requiredLevel: number;
  importance: number;
  criticality: string;
}

export interface RoleProfileDto {
  id: string;
  name: string;
  code: string;
  department: string | null;
  description: string | null;
  competencyCount: number;
  competencies?: RoleCompetencyItemDto[];
}

export class RoleCompetencyService {
  /**
   * Retrieves all active organizational roles with competency counts
   */
  public async getRoles(): Promise<RoleProfileDto[]> {
    const roles = await prisma.roleProfile.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { roleCompetencies: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      department: r.department,
      description: r.description,
      competencyCount: r._count.roleCompetencies,
    }));
  }

  /**
   * Retrieves a specific role with full competency specifications
   */
  public async getRoleById(roleId: string): Promise<RoleProfileDto> {
    const role = await prisma.roleProfile.findFirst({
      where: {
        OR: [{ id: roleId }, { code: roleId }],
      },
      include: {
        roleCompetencies: {
          include: { competency: true },
          orderBy: [{ importance: 'desc' }, { requiredLevel: 'desc' }],
        },
      },
    });

    if (!role) {
      throw new NotFoundError(`Role profile '${roleId}' not found.`);
    }

    return {
      id: role.id,
      name: role.name,
      code: role.code,
      department: role.department,
      description: role.description,
      competencyCount: role.roleCompetencies.length,
      competencies: role.roleCompetencies.map((rc) => ({
        competencyId: rc.competencyId,
        name: rc.competency.name,
        code: rc.competency.code,
        category: rc.competency.category,
        description: rc.competency.description,
        requiredLevel: rc.requiredLevel,
        importance: rc.importance,
        criticality: rc.criticality,
      })),
    };
  }

  /**
   * Directly retrieves required competencies for a role
   */
  public async getRoleCompetencies(roleId: string): Promise<RoleCompetencyItemDto[]> {
    const role = await this.getRoleById(roleId);
    return role.competencies || [];
  }
}

export const roleCompetencyService = new RoleCompetencyService();
