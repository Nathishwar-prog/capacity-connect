/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { Role, UserStatus } from '@prisma/client';
import { app } from '../src/index';
import { TokenUtils } from '../src/auth/token.utils';
import { permissionsMap } from '../src/permissions';
import prisma from '../src/database/client';

async function runUserManagementApiVerification() {
  console.log('============================================================');
  console.log('🌐 STARTING USER MANAGEMENT HTTP VERIFICATION SUITE');
  console.log('============================================================\n');

  // Launch test HTTP server instance
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Test server listening on ephemeral port ${port}`);

  try {
    // 1. Setup Admin, Trainer, and Trainee tokens with valid database user IDs
    const existingAdmin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    const adminUserId = existingAdmin ? existingAdmin.id : 'test-admin-um-uuid';
    const adminEmail = existingAdmin ? existingAdmin.email : 'admin.um@capacityconnect.io';

    const adminToken = TokenUtils.generateAccessToken({
      userId: adminUserId,
      email: adminEmail,
      role: Role.ADMIN,
      permissions: permissionsMap[Role.ADMIN],
    });

    const existingTrainer = await prisma.user.findFirst({ where: { role: Role.TRAINER } });
    const trainerUserId = existingTrainer ? existingTrainer.id : 'test-trainer-um-uuid';
    const trainerEmail = existingTrainer ? existingTrainer.email : 'trainer.um@capacityconnect.io';

    const trainerToken = TokenUtils.generateAccessToken({
      userId: trainerUserId,
      email: trainerEmail,
      role: Role.TRAINER,
      permissions: permissionsMap[Role.TRAINER],
    });

    const existingTrainee = await prisma.user.findFirst({ where: { role: Role.TRAINEE } });
    const traineeUserId = existingTrainee ? existingTrainee.id : 'test-trainee-um-uuid';
    const traineeEmail = existingTrainee ? existingTrainee.email : 'trainee.um@capacityconnect.io';

    const traineeToken = TokenUtils.generateAccessToken({
      userId: traineeUserId,
      email: traineeEmail,
      role: Role.TRAINEE,
      permissions: permissionsMap[Role.TRAINEE],
    });

    const apiCall = async (
      endpoint: string,
      options: {
        method?: string;
        token?: string;
        body?: unknown;
      } = {},
    ) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // --- TEST 1: Swagger UI Documentation Endpoint ---
    console.log('1️⃣  Testing Swagger UI Documentation endpoint (/api-docs)...');
    const swaggerRes = await fetch(`${baseUrl}/api-docs/`);
    if (swaggerRes.status !== 200 && swaggerRes.status !== 301) {
      throw new Error(`Swagger UI failed to load, got status ${swaggerRes.status}`);
    }
    console.log(`   ✅ Swagger UI loaded successfully (Status ${swaggerRes.status}).`);

    // --- TEST 2: Unauthenticated Access ---
    console.log('\n2️⃣  Testing Unauthenticated Access to /api/v1/admin/users...');
    const unauthRes = await apiCall('/api/v1/admin/users');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   ✅ Unauthenticated request correctly rejected with 401.');

    // --- TEST 3: Trainee / Trainer Access (RBAC Authorization) ---
    console.log('\n3️⃣  Testing Trainee and Trainer Access to /api/v1/admin/users...');
    const traineeRes = await apiCall('/api/v1/admin/users', { token: traineeToken });
    if (traineeRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Trainee, got ${traineeRes.status}`);
    }
    const trainerRes = await apiCall('/api/v1/admin/users', { token: trainerToken });
    if (trainerRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Trainer, got ${trainerRes.status}`);
    }
    console.log('   ✅ Non-admin roles rejected with 403 Forbidden.');

    // --- TEST 4: Directory Listing & Pagination (GET /api/v1/admin/users) ---
    console.log('\n4️⃣  Testing Admin Directory Listing & Pagination...');
    const listRes = await apiCall('/api/v1/admin/users?page=1&limit=5', { token: adminToken });
    if (listRes.status !== 200) {
      throw new Error(`Expected 200 OK for Admin user list, got ${listRes.status}: ${JSON.stringify(listRes.data)}`);
    }
    if (!listRes.data.success || !Array.isArray(listRes.data.data) || !listRes.data.meta) {
      throw new Error(`Invalid response structure for user directory: ${JSON.stringify(listRes.data)}`);
    }
    if (listRes.data.meta.page !== 1 || listRes.data.meta.limit !== 5) {
      throw new Error(`Pagination metadata mismatch: ${JSON.stringify(listRes.data.meta)}`);
    }
    // Verify no passwordHash in list
    if (listRes.data.data.length > 0 && listRes.data.data[0].passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash exposed in user listing!');
    }
    console.log(`   ✅ User list returned ${listRes.data.data.length} users with total: ${listRes.data.meta.total}, totalPages: ${listRes.data.meta.totalPages}`);

    // --- TEST 5: Filter by Role, Status, and Department ---
    console.log('\n5️⃣  Testing Multi-Dimensional Filtering (role, status)...');
    const roleFiltered = await apiCall('/api/v1/admin/users?role=TRAINEE', { token: adminToken });
    if (roleFiltered.status !== 200) {
      throw new Error(`Expected 200 OK for role filter, got ${roleFiltered.status}`);
    }
    const allTrainees = roleFiltered.data.data.every((u: { role: string }) => u.role === 'TRAINEE');
    if (!allTrainees) {
      throw new Error('Role filter returned non-trainee users!');
    }
    console.log(`   ✅ Role filter (role=TRAINEE) succeeded (${roleFiltered.data.data.length} users matched).`);

    const statusFiltered = await apiCall('/api/v1/admin/users?status=APPROVED', { token: adminToken });
    if (statusFiltered.status !== 200) {
      throw new Error(`Expected 200 OK for status filter, got ${statusFiltered.status}`);
    }
    const allApproved = statusFiltered.data.data.every((u: { status: string }) => u.status === 'APPROVED');
    if (!allApproved) {
      throw new Error('Status filter returned non-approved users!');
    }
    console.log(`   ✅ Status filter (status=APPROVED) succeeded (${statusFiltered.data.data.length} users matched).`);

    // --- TEST 6: Search Functionality ---
    console.log('\n6️⃣  Testing Case-Insensitive Search...');
    const searchRes = await apiCall('/api/v1/admin/users?search=imd', { token: adminToken });
    if (searchRes.status !== 200) {
      throw new Error(`Expected 200 OK for search, got ${searchRes.status}`);
    }
    console.log(`   ✅ Search filter (search=imd) succeeded (${searchRes.data.data.length} users matched).`);

    // --- TEST 7: Invalid Query Parameter Validation ---
    console.log('\n7️⃣  Testing Zod Query Validation (Invalid Role)...');
    const invalidQueryRes = await apiCall('/api/v1/admin/users?role=SUPER_USER', { token: adminToken });
    if (invalidQueryRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid role query, got ${invalidQueryRes.status}`);
    }
    console.log('   ✅ Invalid query parameter properly rejected with 400 Bad Request.');

    // --- Setup Test Users in Database for Mutation Tests ---
    console.log('\n🔧 Preparing target users in database for mutations...');
    const defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      throw new Error('No organization found in database to attach test users');
    }

    // User A: for Approval
    const userToApprove = await prisma.user.create({
      data: {
        organizationId: defaultOrg.id,
        email: `test.approve.${Date.now()}@capacityconnect.io`,
        passwordHash: 'dummy_hash',
        firstName: 'Approve',
        lastName: 'Target',
        role: Role.TRAINEE,
        status: UserStatus.PENDING,
      },
    });

    // User B: for Rejection
    const userToReject = await prisma.user.create({
      data: {
        organizationId: defaultOrg.id,
        email: `test.reject.${Date.now()}@capacityconnect.io`,
        passwordHash: 'dummy_hash',
        firstName: 'Reject',
        lastName: 'Target',
        role: Role.TRAINEE,
        status: UserStatus.PENDING,
      },
    });

    // User C: for Status & Role Mutation
    const userToMutate = await prisma.user.create({
      data: {
        organizationId: defaultOrg.id,
        email: `test.mutate.${Date.now()}@capacityconnect.io`,
        passwordHash: 'dummy_hash',
        firstName: 'Mutate',
        lastName: 'Target',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
      },
    });

    // --- TEST 8: GET /api/v1/admin/users/:id ---
    console.log('\n8️⃣  Testing GET /api/v1/admin/users/:id (Safe Details)...');
    const detailRes = await apiCall(`/api/v1/admin/users/${userToApprove.id}`, { token: adminToken });
    if (detailRes.status !== 200) {
      throw new Error(`Expected 200 OK for user detail, got ${detailRes.status}: ${JSON.stringify(detailRes.data)}`);
    }
    if (detailRes.data.data.passwordHash) {
      throw new Error('SECURITY VIOLATION: passwordHash exposed in user detail!');
    }
    if (detailRes.data.data.id !== userToApprove.id) {
      throw new Error(`ID mismatch in user detail: expected ${userToApprove.id}, got ${detailRes.data.data.id}`);
    }
    console.log('   ✅ User details retrieved safely without exposing credentials.');

    // --- TEST 9: Non-existent User 404 ---
    console.log('\n9️⃣  Testing Non-existent User (404 Not Found)...');
    const notFoundRes = await apiCall('/api/v1/admin/users/00000000-0000-0000-0000-000000000000', {
      token: adminToken,
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 Not Found for non-existent user, got ${notFoundRes.status}`);
    }
    console.log('   ✅ Non-existent user properly returns 404 Not Found.');

    // --- TEST 10: PATCH /api/v1/admin/users/:id/approve ---
    console.log('\n🔟 Testing PATCH /api/v1/admin/users/:id/approve...');
    const approveRes = await apiCall(`/api/v1/admin/users/${userToApprove.id}/approve`, {
      method: 'PATCH',
      token: adminToken,
    });
    if (approveRes.status !== 200) {
      throw new Error(`Expected 200 OK for approve, got ${approveRes.status}: ${JSON.stringify(approveRes.data)}`);
    }
    if (approveRes.data.data.status !== 'APPROVED') {
      throw new Error(`Expected status to be APPROVED, got ${approveRes.data.data.status}`);
    }
    // Verify audit log
    const approveAudit = await prisma.auditLog.findFirst({
      where: { entityId: userToApprove.id, action: 'USER_APPROVED' },
    });
    if (!approveAudit) {
      throw new Error('Audit log record for USER_APPROVED was not created!');
    }
    console.log('   ✅ User approved successfully and USER_APPROVED audit record verified.');

    // --- TEST 11: PATCH /api/v1/admin/users/:id/reject ---
    console.log('\n1️⃣1️⃣ Testing PATCH /api/v1/admin/users/:id/reject...');
    const rejectRes = await apiCall(`/api/v1/admin/users/${userToReject.id}/reject`, {
      method: 'PATCH',
      token: adminToken,
    });
    if (rejectRes.status !== 200) {
      throw new Error(`Expected 200 OK for reject, got ${rejectRes.status}: ${JSON.stringify(rejectRes.data)}`);
    }
    if (rejectRes.data.data.status !== 'REJECTED') {
      throw new Error(`Expected status to be REJECTED, got ${rejectRes.data.data.status}`);
    }
    const rejectAudit = await prisma.auditLog.findFirst({
      where: { entityId: userToReject.id, action: 'USER_REJECTED' },
    });
    if (!rejectAudit) {
      throw new Error('Audit log record for USER_REJECTED was not created!');
    }
    console.log('   ✅ User rejected successfully and USER_REJECTED audit record verified.');

    // --- TEST 12: PATCH /api/v1/admin/users/:id/status (Suspension) ---
    console.log('\n1️⃣2️⃣ Testing PATCH /api/v1/admin/users/:id/status (Suspension)...');
    const suspendRes = await apiCall(`/api/v1/admin/users/${userToMutate.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'SUSPENDED' },
    });
    if (suspendRes.status !== 200) {
      throw new Error(`Expected 200 OK for suspend, got ${suspendRes.status}: ${JSON.stringify(suspendRes.data)}`);
    }
    if (suspendRes.data.data.status !== 'SUSPENDED') {
      throw new Error(`Expected status to be SUSPENDED, got ${suspendRes.data.data.status}`);
    }
    const suspendAudit = await prisma.auditLog.findFirst({
      where: { entityId: userToMutate.id, action: 'ACCOUNT_SUSPENDED' },
    });
    if (!suspendAudit) {
      throw new Error('Audit log record for ACCOUNT_SUSPENDED was not created!');
    }
    console.log('   ✅ User suspended and ACCOUNT_SUSPENDED audit record verified.');

    // --- TEST 13: PATCH /api/v1/admin/users/:id/role ---
    console.log('\n1️⃣3️⃣ Testing PATCH /api/v1/admin/users/:id/role...');
    const roleRes = await apiCall(`/api/v1/admin/users/${userToMutate.id}/role`, {
      method: 'PATCH',
      token: adminToken,
      body: { role: 'TRAINER' },
    });
    if (roleRes.status !== 200) {
      throw new Error(`Expected 200 OK for role update, got ${roleRes.status}: ${JSON.stringify(roleRes.data)}`);
    }
    if (roleRes.data.data.role !== 'TRAINER') {
      throw new Error(`Expected role to be TRAINER, got ${roleRes.data.data.role}`);
    }
    const roleAudit = await prisma.auditLog.findFirst({
      where: { entityId: userToMutate.id, action: 'ROLE_CHANGED' },
    });
    if (!roleAudit) {
      throw new Error('Audit log record for ROLE_CHANGED was not created!');
    }
    console.log('   ✅ User role updated to TRAINER and ROLE_CHANGED audit record verified.');

    // --- TEST 14: Privilege Escalation Spoofing Rejection ---
    console.log('\n1️⃣4️⃣ Testing Client Privilege Escalation Spoofing Rejection...');
    const spoofRoleRes = await apiCall(`/api/v1/admin/users/${userToMutate.id}/role`, {
      method: 'PATCH',
      token: traineeToken,
      body: { role: 'ADMIN' },
    });
    if (spoofRoleRes.status !== 403) {
      throw new Error(`Privilege escalation flaw: Trainee could call update role with status ${spoofRoleRes.status}`);
    }
    console.log('   ✅ Trainee privilege escalation attempt blocked with 403 Forbidden.');

    // --- TEST 15: Direct /admin/users Root Alias ---
    console.log('\n1️⃣5️⃣ Testing Root /admin/users Alias Path...');
    const rootAliasRes = await apiCall('/admin/users?limit=1', { token: adminToken });
    if (rootAliasRes.status !== 200) {
      throw new Error(`Expected 200 OK on root /admin/users alias, got ${rootAliasRes.status}`);
    }
    console.log('   ✅ Root /admin/users alias endpoint verified successfully.');

    // Clean up test users
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [userToApprove.id, userToReject.id, userToMutate.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userToApprove.id, userToReject.id, userToMutate.id] } },
    });

    console.log('\n============================================================');
    console.log('🎉 ALL 15 USER MANAGEMENT HTTP INTEGRATION TESTS PASSED!');
    console.log('============================================================\n');
  } finally {
    testServer.close();
  }
}

runUserManagementApiVerification()
  .catch((err) => {
    console.error('❌ User Management Verification Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
