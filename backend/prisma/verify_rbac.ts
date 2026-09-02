/// <reference path="../src/types/express.d.ts" />
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import {
  authenticate,
  requireRole,
  requirePermission,
  requireSelfOrRole,
} from '../src/auth/auth.middleware';
import { Permissions } from '../src/permissions';
import { TokenUtils, TokenPayload } from '../src/auth/token.utils';

function mockRequest(options: {
  headers?: Record<string, string>;
  user?: TokenPayload;
  params?: Record<string, string>;
}): Request {
  return {
    headers: options.headers || {},
    user: options.user,
    params: options.params || {},
  } as unknown as Request;
}

const mockResponse = {} as Response;

async function verifyRbacMilestone() {
  console.log('🧪 Starting Milestone 3: RBAC & Permissions Verification Suite...\n');

  // Test payloads
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
    permissions: [
      Permissions.USERS_READ,
      Permissions.USERS_WRITE,
      Permissions.COURSES_APPROVE,
    ],
  };

  const trainerPayload: TokenPayload = {
    userId: 'trainer-uuid-003',
    email: 'trainer@capacityconnect.io',
    role: Role.TRAINER,
    permissions: [Permissions.COURSES_READ, Permissions.COURSES_WRITE],
  };

  const traineePayload: TokenPayload = {
    userId: 'trainee-uuid-004',
    email: 'trainee@capacityconnect.io',
    role: Role.TRAINEE,
    permissions: [Permissions.COURSES_READ, Permissions.ASSESSMENTS_TAKE],
  };

  // 1. Test Authentication Middleware with Valid / Invalid Tokens
  console.log('1️⃣  Testing Authentication Middleware Token Guards...');
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

  // 3. Test Fine-Grained Permission Guards (requirePermission)
  console.log('\n3️⃣  Testing Fine-Grained Permission Guards (requirePermission)...');
  const courseApproveGuard = requirePermission(Permissions.COURSES_APPROVE);

  let adminPermPassed = false;
  courseApproveGuard(mockRequest({ user: adminPayload }), mockResponse, (err?: any) => {
    if (!err) adminPermPassed = true;
  });
  if (!adminPermPassed) throw new Error('Admin with COURSES_APPROVE failed permission check');
  console.log('   ✅ User with COURSES_APPROVE passed check.');

  let trainerPermDenied = false;
  courseApproveGuard(mockRequest({ user: trainerPayload }), mockResponse, (err?: any) => {
    if (err && err.statusCode === 403) trainerPermDenied = true;
  });
  if (!trainerPermDenied) throw new Error('Trainer without COURSES_APPROVE was not blocked');
  console.log('   ✅ User lacking COURSES_APPROVE denied (403 Forbidden).');

  let superAdminWildcardPassed = false;
  courseApproveGuard(mockRequest({ user: superAdminPayload }), mockResponse, (err?: any) => {
    if (!err) superAdminWildcardPassed = true;
  });
  if (!superAdminWildcardPassed) throw new Error('Super Admin wildcard failed permission check');
  console.log('   ✅ SUPER_ADMIN wildcard (*) passed permission check.');

  // 4. Test Self or Role Guard (requireSelfOrRole)
  console.log('\n4️⃣  Testing Self-or-Role Guard (requireSelfOrRole)...');
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
  console.log('🎉 ALL 11 RBAC & PERMISSION GUARD TESTS PASSED!');
  console.log('======================================================');
}

verifyRbacMilestone().catch((e) => {
  console.error('\n❌ RBAC Verification Failed:', e);
  process.exit(1);
});
