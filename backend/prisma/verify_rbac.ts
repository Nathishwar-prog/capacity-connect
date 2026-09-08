/// <reference path="../src/types/express.d.ts" />
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  requireRole,
  requirePermission,
  requireSelfOrRole,
} from '../src/auth/auth.middleware';
import { Permissions, SOURCE_PERMISSIONS, permissionsMap, hasPermission } from '../src/permissions';
import { TokenUtils, TokenPayload } from '../src/auth/token.utils';
import { RbacService } from '../src/services/rbac.service';
import { RbacRepository } from '../src/repositories/rbac.repository';
import prisma from '../src/database/client';

function mockRequest(options: {
  headers?: Record<string, string>;
  user?: TokenPayload;
  params?: Record<string, string>;
  body?: Record<string, any>;
  query?: Record<string, any>;
}): Request {
  return {
    headers: options.headers || {},
    user: options.user,
    params: options.params || {},
    body: options.body || {},
    query: options.query || {},
  } as unknown as Request;
}

const mockResponse = {} as Response;

async function verifyRbacMilestone() {
  console.log('🧪 Starting Capacity Connect: M2 Development 2 — RBAC Verification Suite...\n');

  // 0. Synchronize Permissions in Database
  console.log('0️⃣  Testing RBAC Repository & DB Permission Synchronization...');
  if (SOURCE_PERMISSIONS.length !== 10) {
    throw new Error(`Expected exactly 10 source permissions, found: ${SOURCE_PERMISSIONS.length}`);
  }
  const rbacRepo = new RbacRepository();
  const rbacService = new RbacService(rbacRepo);
  await rbacService.syncPermissions();
  console.log(`   ✅ ${SOURCE_PERMISSIONS.length} source permissions synchronized into PostgreSQL permissions & role_permissions tables.`);

  // Test payloads generated using source-defined role mappings
  const superAdminPayload: TokenPayload = {
    userId: 'super-admin-uuid-001',
    email: 'superadmin@capacityconnect.io',
    role: Role.SUPER_ADMIN,
    permissions: ['*'],
  };

  const adminPayload: TokenPayload = {
    userId: 'admin-uuid-002',
    email: 'admin@capacityconnect.io',
    role: Role.ADMIN,
    permissions: permissionsMap[Role.ADMIN],
  };

  const trainerPayload: TokenPayload = {
    userId: 'trainer-uuid-003',
    email: 'trainer@capacityconnect.io',
    role: Role.TRAINER,
    permissions: permissionsMap[Role.TRAINER],
  };

  const traineePayload: TokenPayload = {
    userId: 'trainee-uuid-004',
    email: 'trainee@capacityconnect.io',
    role: Role.TRAINEE,
    permissions: permissionsMap[Role.TRAINEE],
  };

  // 1. Test Authentication Middleware Guards (Authentication Boundary)
  console.log('\n1️⃣  Testing Authentication Middleware Token Guards...');
  const validToken = TokenUtils.generateAccessToken(traineePayload);

  let authPassed = false;
  const reqValidAuth = mockRequest({ headers: { authorization: `Bearer ${validToken}` } });
  authenticate(reqValidAuth, mockResponse, (err?: any) => {
    if (!err && reqValidAuth.user?.email === traineePayload.email) authPassed = true;
  });
  if (!authPassed) throw new Error('Authentication failed for valid Bearer token');
  console.log('   ✅ Valid Bearer token authenticated and payload attached.');

  let unauthBlocked = false;
  const reqNoAuth = mockRequest({ headers: {} });
  authenticate(reqNoAuth, mockResponse, (err?: any) => {
    if (err && err.statusCode === 401) unauthBlocked = true;
  });
  if (!unauthBlocked) throw new Error('Missing token was not rejected with 401');
  console.log('   ✅ Missing token rejected with 401 Unauthorized.');

  let malformedBlocked = false;
  const reqBadAuth = mockRequest({ headers: { authorization: 'Bearer invalid.token.string' } });
  authenticate(reqBadAuth, mockResponse, (err?: any) => {
    if (err && err.statusCode === 401) malformedBlocked = true;
  });
  if (!malformedBlocked) throw new Error('Malformed token was not rejected with 401');
  console.log('   ✅ Malformed token rejected with 401 Unauthorized.');

  // 2. Test Role Guards (requireRole)
  console.log('\n2️⃣  Testing Role-Based Access Control (requireRole)...');
  const adminOnlyGuard = requireRole([Role.ADMIN]);

  let adminAllowed = false;
  adminOnlyGuard(mockRequest({ user: adminPayload }), mockResponse, (err?: any) => {
    if (!err) adminAllowed = true;
  });
  if (!adminAllowed) throw new Error('Admin role failed to pass Admin guard');
  console.log('   ✅ ADMIN allowed on ADMIN-only route.');

  let superAdminBypass = false;
  adminOnlyGuard(mockRequest({ user: superAdminPayload }), mockResponse, (err?: any) => {
    if (!err) superAdminBypass = true;
  });
  if (!superAdminBypass) throw new Error('SUPER_ADMIN failed to bypass Admin guard');
  console.log('   ✅ SUPER_ADMIN unrestricted bypass verified.');

  let trainerBlocked = false;
  adminOnlyGuard(mockRequest({ user: trainerPayload }), mockResponse, (err?: any) => {
    if (err && err.statusCode === 403) trainerBlocked = true;
  });
  if (!trainerBlocked) throw new Error('TRAINER was not rejected with 403 on Admin route');
  console.log('   ✅ TRAINER rejected with 403 Forbidden.');

  let traineeBlocked = false;
  adminOnlyGuard(mockRequest({ user: traineePayload }), mockResponse, (err?: any) => {
    if (err && err.statusCode === 403) traineeBlocked = true;
  });
  if (!traineeBlocked) throw new Error('TRAINEE was not rejected with 403 on Admin route');
  console.log('   ✅ TRAINEE rejected with 403 Forbidden.');

  // 3. Test Verification of All 10 Source-Defined Permissions Individually
  console.log('\n3️⃣  Testing All 10 Source-Defined Permissions (requirePermission)...');

  const expectedAdminPermissions = [
    Permissions.USER_READ,
    Permissions.USER_APPROVE,
    Permissions.USER_REJECT,
    Permissions.USER_ROLE_UPDATE,
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.COURSE_APPROVE,
    Permissions.ASSESSMENT_CREATE,
    Permissions.RESOURCE_UPLOAD,
    Permissions.ANALYTICS_VIEW,
  ];

  const expectedTrainerPermissions = [
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.ASSESSMENT_CREATE,
    Permissions.RESOURCE_UPLOAD,
    Permissions.ANALYTICS_VIEW,
  ];

  const expectedTrainerDeniedPermissions = [
    Permissions.USER_READ,
    Permissions.USER_APPROVE,
    Permissions.USER_REJECT,
    Permissions.USER_ROLE_UPDATE,
    Permissions.COURSE_APPROVE,
  ];

  for (const perm of expectedAdminPermissions) {
    const guard = requirePermission(perm);

    // Test Admin: Must be allowed for all 10 permissions
    let adminOk = false;
    guard(mockRequest({ user: adminPayload }), mockResponse, (err?: any) => {
      if (!err) adminOk = true;
    });
    if (!adminOk) throw new Error(`ADMIN was unexpectedly denied permission: ${perm}`);

    // Test Trainee: Must be rejected (403) for all 10 source permissions
    let traineeBlocked = false;
    guard(mockRequest({ user: traineePayload }), mockResponse, (err?: any) => {
      if (err && err.statusCode === 403) traineeBlocked = true;
    });
    if (!traineeBlocked) throw new Error(`TRAINEE was not rejected with 403 for permission: ${perm}`);

    // Test Super Admin: Must pass via wildcard bypass
    let superAdminOk = false;
    guard(mockRequest({ user: superAdminPayload }), mockResponse, (err?: any) => {
      if (!err) superAdminOk = true;
    });
    if (!superAdminOk) throw new Error(`SUPER_ADMIN wildcard failed for permission: ${perm}`);

    console.log(`   ✅ Permission '${perm}': ADMIN allowed, TRAINEE denied (403), SUPER_ADMIN allowed.`);
  }

  // 3. Test Trainer Role Specific Boundary
  console.log('\n3️⃣  Testing TRAINER Specific Role Permissions Boundary...');
  for (const perm of expectedTrainerPermissions) {
    const guard = requirePermission(perm);
    let trainerOk = false;
    guard(mockRequest({ user: trainerPayload }), mockResponse, (err?: any) => {
      if (!err) trainerOk = true;
    });
    if (!trainerOk) throw new Error(`TRAINER was denied allowed permission: ${perm}`);
    console.log(`   ✅ TRAINER granted authorized permission: '${perm}'`);
  }

  for (const perm of expectedTrainerDeniedPermissions) {
    const guard = requirePermission(perm);
    let trainerBlocked = false;
    guard(mockRequest({ user: trainerPayload }), mockResponse, (err?: any) => {
      if (err && err.statusCode === 403) trainerBlocked = true;
    });
    if (!trainerBlocked) throw new Error(`TRAINER was not blocked for admin permission: ${perm}`);
    console.log(`   ✅ TRAINER denied restricted admin permission: '${perm}' (403 Forbidden)`);
  }

  // 4. Test Client Injection / Spoofing Resilience
  console.log('\n4️⃣  Testing Security: Client Injection Attack Resistance...');
  // A malicious client passes role: 'ADMIN' in request body/query, but JWT token is TRAINEE
  const spoofedBodyRequest = mockRequest({
    user: traineePayload,
    body: { role: 'ADMIN', permissions: ['*'] },
    query: { role: 'ADMIN' },
    headers: { 'x-role': 'ADMIN', 'x-permission': 'user:approve' },
  });

  const userApproveGuard = requirePermission(Permissions.USER_APPROVE);
  let spoofBlocked = false;
  userApproveGuard(spoofedBodyRequest, mockResponse, (err?: any) => {
    if (err && err.statusCode === 403) spoofBlocked = true;
  });
  if (!spoofBlocked) throw new Error('Security flaw: Client body/query role injection bypassed authorization');
  console.log('   ✅ Client body/query/header role spoofing was completely ignored. Denied with 403.');

  // 5. Test RbacService Business Logic & Error Handling
  console.log('\n5️⃣  Testing RbacService Layer...');
  const matrix = rbacService.getRolePermissionMatrix();
  if (!matrix.ADMIN.includes(Permissions.USER_READ) || !matrix.TRAINER.includes(Permissions.COURSE_CREATE)) {
    throw new Error('RbacService returned invalid permission matrix');
  }
  console.log('   ✅ RbacService.getRolePermissionMatrix() returns verified source mapping.');

  const hasPermDirect = rbacService.hasPermission(Role.ADMIN, matrix.ADMIN, Permissions.USER_ROLE_UPDATE);
  if (!hasPermDirect) throw new Error('RbacService.hasPermission returned false for ADMIN user:role:update');
  const hasPermTraineeDenied = rbacService.hasPermission(Role.TRAINEE, matrix.TRAINEE, Permissions.USER_ROLE_UPDATE);
  if (hasPermTraineeDenied) throw new Error('RbacService.hasPermission returned true for TRAINEE user:role:update');
  console.log('   ✅ RbacService.hasPermission() direct evaluation verified.');

  const directHasPermissionCheck = hasPermission(Role.ADMIN, matrix.ADMIN, Permissions.ANALYTICS_VIEW);
  if (!directHasPermissionCheck) throw new Error('Direct hasPermission() failed for ADMIN analytics:view');
  console.log('   ✅ Direct hasPermission() utility verified.');

  // 6. Test Self or Role Guard (requireSelfOrRole)
  console.log('\n6️⃣  Testing Self-or-Role Guard (requireSelfOrRole)...');
  const selfOrAdminGuard = requireSelfOrRole([Role.ADMIN, Role.SUPER_ADMIN]);

  let selfAllowed = false;
  selfOrAdminGuard(
    mockRequest({ user: traineePayload, params: { id: traineePayload.userId } }),
    mockResponse,
    (err?: any) => {
      if (!err) selfAllowed = true;
    },
  );
  if (!selfAllowed) throw new Error('User failed to access own resource');
  console.log('   ✅ User operating on own resource ID allowed.');

  let crossUserBlocked = false;
  selfOrAdminGuard(
    mockRequest({ user: traineePayload, params: { id: 'other-user-uuid-999' } }),
    mockResponse,
    (err?: any) => {
      if (err && err.statusCode === 403) crossUserBlocked = true;
    },
  );
  if (!crossUserBlocked) throw new Error('User was not blocked when accessing another user resource');
  console.log('   ✅ User accessing another user resource rejected (403 Forbidden).');

  let adminCrossUserAllowed = false;
  selfOrAdminGuard(
    mockRequest({ user: adminPayload, params: { id: 'other-user-uuid-999' } }),
    mockResponse,
    (err?: any) => {
      if (!err) adminCrossUserAllowed = true;
    },
  );
  if (!adminCrossUserAllowed) throw new Error('Admin failed to access target user resource');
  console.log('   ✅ Privileged ADMIN operating on another user allowed.');

  console.log('\n======================================================');
  console.log('🎉 ALL 20 RBAC SOURCE PERMISSION & SECURITY TESTS PASSED!');
  console.log('======================================================');
}

verifyRbacMilestone()
  .catch((e) => {
    console.error('\n❌ RBAC Verification Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
