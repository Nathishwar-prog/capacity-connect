import prisma from '../database/client';
import { Role, UserStatus } from '@prisma/client';
import { SOURCE_PERMISSIONS, permissionsMap, Permissions } from '../permissions';

export interface IRbacRepository {
  getUserRoleAndStatus(userId: string): Promise<{ role: Role; status: UserStatus } | null>;
  getUserPermissions(userId: string): Promise<string[]>;
  getRolePermissions(roleName: string): Promise<string[]>;
  hasRolePermission(roleName: string, permissionName: string): Promise<boolean>;
  syncSourcePermissions(): Promise<void>;
}

export class RbacRepository implements IRbacRepository {
  /**
   * Retrieves the trusted server-side role and account status for a given user
   */
  public async getUserRoleAndStatus(
    userId: string,
  ): Promise<{ role: Role; status: UserStatus } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        status: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      role: user.role,
      status: user.status,
    };
  }

  /**
   * Resolves the full list of granted permissions for a user from database role mappings
   */
  public async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return [];
    }

    if (user.role === Role.SUPER_ADMIN) {
      return ['*'];
    }

    const appRole = await prisma.appRole.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!appRole) {
      // Fallback to static code-based matrix if database records are not yet synchronized
      return permissionsMap[user.role] || [];
    }

    const dbPermissions = appRole.permissions.map((rp) => rp.permission.name);
    const codePermissions = permissionsMap[user.role] || [];

    // Combine and deduplicate
    return Array.from(new Set([...codePermissions, ...dbPermissions]));
  }

  /**
   * Retrieves all permissions mapped to an AppRole by name
   */
  public async getRolePermissions(roleName: string): Promise<string[]> {
    const appRole = await prisma.appRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!appRole) {
      return permissionsMap[roleName as Role] || [];
    }

    return appRole.permissions.map((rp) => rp.permission.name);
  }

  /**
   * Verifies if a role has been granted a specific permission in the database
   */
  public async hasRolePermission(roleName: string, permissionName: string): Promise<boolean> {
    if (roleName === Role.SUPER_ADMIN) {
      return true;
    }

    const appRole = await prisma.appRole.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!appRole) {
      const fallback = permissionsMap[roleName as Role] || [];
      return fallback.includes(permissionName) || fallback.includes('*');
    }

    const hasDbPerm = appRole.permissions.some((rp) => rp.permission.name === permissionName);
    if (hasDbPerm) {
      return true;
    }

    // Fallback check on standard code matrix
    const fallback = permissionsMap[roleName as Role] || [];
    return fallback.includes(permissionName) || fallback.includes('*');
  }

  /**
   * Synchronizes the 10 source permissions into the database `permissions` and `role_permissions` tables
   */
  public async syncSourcePermissions(): Promise<void> {
    // 1. Ensure all 10 source permissions exist in AppPermission
    const permissionDescriptions: Record<string, string> = {
      [Permissions.USER_READ]: 'Read user directory and profile metadata',
      [Permissions.USER_APPROVE]: 'Approve pending user account registrations',
      [Permissions.USER_REJECT]: 'Reject pending or unauthorized user accounts',
      [Permissions.USER_ROLE_UPDATE]: 'Modify and govern user role assignments',
      [Permissions.COURSE_CREATE]: 'Author and structure new official courses',
      [Permissions.COURSE_UPDATE]: 'Edit and update existing course curriculum',
      [Permissions.COURSE_APPROVE]: 'Formally evaluate, verify, and approve course publication',
      [Permissions.ASSESSMENT_CREATE]: 'Design and deploy assessment tests and questionnaires',
      [Permissions.RESOURCE_UPLOAD]: 'Upload domain scientific learning resources',
      [Permissions.ANALYTICS_VIEW]: 'Inspect executive capacity and skill gap analytics dashboards',
    };

    for (const permName of SOURCE_PERMISSIONS) {
      await prisma.appPermission.upsert({
        where: { name: permName },
        update: { description: permissionDescriptions[permName] || 'Source RBAC permission' },
        create: {
          name: permName,
          description: permissionDescriptions[permName] || 'Source RBAC permission',
        },
      });
    }

    // 2. Ensure roles exist: SUPER_ADMIN, ADMIN, TRAINER, TRAINEE
    const rolesData = [
      {
        name: 'SUPER_ADMIN',
        description: 'Ministry Level Platform Administrator with full access',
      },
      {
        name: 'ADMIN',
        description: 'Departmental Administrator for training governance and approvals',
      },
      {
        name: 'TRAINER',
        description: 'Senior Scientist / Course Instructor managing modules and assessments',
      },
      {
        name: 'TRAINEE',
        description: 'Scientific Officer / Meteorologist learner acquiring competencies',
      },
    ];

    for (const r of rolesData) {
      await prisma.appRole.upsert({
        where: { name: r.name },
        update: { description: r.description },
        create: r,
      });
    }

    // 3. Map permissions to roles
    const allDbPermissions = await prisma.appPermission.findMany();
    const permMap = new Map(allDbPermissions.map((p) => [p.name, p.id]));

    const adminRole = await prisma.appRole.findUnique({ where: { name: Role.ADMIN } });
    const trainerRole = await prisma.appRole.findUnique({ where: { name: Role.TRAINER } });
    const superAdminRole = await prisma.appRole.findUnique({ where: { name: Role.SUPER_ADMIN } });

    // Link SUPER_ADMIN to all
    if (superAdminRole) {
      for (const p of allDbPermissions) {
        await prisma.rolePermissionMapping.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: p.id,
          },
        });
      }
    }

    // Link ADMIN to all 10 source permissions
    if (adminRole) {
      for (const pName of SOURCE_PERMISSIONS) {
        const pId = permMap.get(pName);
        if (pId) {
          await prisma.rolePermissionMapping.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: pId,
              },
            },
            update: {},
            create: {
              roleId: adminRole.id,
              permissionId: pId,
            },
          });
        }
      }
    }

    // Link TRAINER to trainer source permissions
    if (trainerRole) {
      const trainerSourcePerms = [
        Permissions.COURSE_CREATE,
        Permissions.COURSE_UPDATE,
        Permissions.ASSESSMENT_CREATE,
        Permissions.RESOURCE_UPLOAD,
        Permissions.ANALYTICS_VIEW,
      ];
      for (const pName of trainerSourcePerms) {
        const pId = permMap.get(pName);
        if (pId) {
          await prisma.rolePermissionMapping.upsert({
            where: {
              roleId_permissionId: {
                roleId: trainerRole.id,
                permissionId: pId,
              },
            },
            update: {},
            create: {
              roleId: trainerRole.id,
              permissionId: pId,
            },
          });
        }
      }
    }
  }
}

export default RbacRepository;
