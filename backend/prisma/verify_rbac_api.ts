/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { Role } from '@prisma/client';
import { app, server } from '../src/index';
import { TokenUtils } from '../src/auth/token.utils';
import { permissionsMap } from '../src/permissions';
import prisma from '../src/database/client';

async function runRbacApiIntegrationTests() {
  console.log('🌐 Starting Real HTTP RBAC API Integration Test Suite...\n');

  // Launch a test HTTP server instance
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`📡 Test server listening on ephemeral port ${port}`);

  try {
    // Generate valid tokens for each role
    const adminToken = TokenUtils.generateAccessToken({
      userId: 'test-admin-api-uuid',
      email: 'admin.test@capacityconnect.io',
      role: Role.ADMIN,
      permissions: permissionsMap[Role.ADMIN],
    });

    const trainerToken = TokenUtils.generateAccessToken({
      userId: 'test-trainer-api-uuid',
      email: 'trainer.test@capacityconnect.io',
      role: Role.TRAINER,
      permissions: permissionsMap[Role.TRAINER],
    });

    const traineeToken = TokenUtils.generateAccessToken({
      userId: 'test-trainee-api-uuid',
      email: 'trainee.test@capacityconnect.io',
      role: Role.TRAINEE,
      permissions: permissionsMap[Role.TRAINEE],
    });

    // Helper to make fetch requests
    const apiCall = async (
      endpoint: string,
      options: {
        method?: string;
        token?: string;
        body?: any;
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

    // Test 1: Unauthenticated request to protected endpoint (GET /users)
    console.log('1️⃣  Testing Unauthenticated Request to Protected Route (GET /users)...');
    const unauthRes = await apiCall('/users');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected status 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   ✅ Rejected with 401 Unauthorized.');

    // Test 2: Trainee calling GET /users (requires user:read)
    console.log('\n2️⃣  Testing Trainee Forbidden on Admin Route (GET /users requires user:read)...');
    const traineeUserRes = await apiCall('/users', { token: traineeToken });
    if (traineeUserRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Trainee accessing /users, got ${traineeUserRes.status}`);
    }
    console.log('   ✅ Trainee rejected with 403 Forbidden.');

    // Test 3: Trainee role injection in query and POST body
    console.log('\n3️⃣  Testing Trainee Privilege Escalation Spoofing...');
    const spoofQueryRes = await apiCall('/users?role=ADMIN&permissions=*', {
      method: 'GET',
      token: traineeToken,
    });
    if (spoofQueryRes.status !== 403) {
      throw new Error(`Security breach: Client role query spoofing succeeded with status ${spoofQueryRes.status}`);
    }

    const spoofPostRes = await apiCall('/users', {
      method: 'POST',
      token: traineeToken,
      body: {
        email: 'spoofed@capacityconnect.io',
        password: 'Password123!',
        firstName: 'Spoofed',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    if (spoofPostRes.status !== 403) {
      throw new Error(`Security breach: Trainee role spoofing on POST /users succeeded with status ${spoofPostRes.status}`);
    }
    console.log('   ✅ Trainee role spoofing in query & POST body rejected with 403 Forbidden.');

    // Test 4: Trainer calling GET /users (requires user:read - Trainer lacks user:read)
    console.log('\n4️⃣  Testing Trainer Forbidden on User Management (GET /users)...');
    const trainerUserRes = await apiCall('/users', { token: trainerToken });
    if (trainerUserRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Trainer accessing /users, got ${trainerUserRes.status}`);
    }
    console.log('   ✅ Trainer rejected with 403 Forbidden on user:read endpoint.');

    // Test 5: Trainer calling GET /trainer/analytics (requires analytics:view)
    console.log('\n5️⃣  Testing Trainer Authorized on Trainer Analytics (requires analytics:view)...');
    const trainerAnalyticsRes = await apiCall('/trainer/analytics', { token: trainerToken });
    // Since this is an authorized trainer, should not be 401 or 403
    if (trainerAnalyticsRes.status === 401 || trainerAnalyticsRes.status === 403) {
      throw new Error(`Trainer unexpectedly denied access to analytics: status ${trainerAnalyticsRes.status}`);
    }
    console.log(`   ✅ Trainer successfully authorized with permission analytics:view (Status ${trainerAnalyticsRes.status}).`);

    // Test 6: Admin calling GET /users (requires user:read)
    console.log('\n6️⃣  Testing Admin Authorized on GET /users (requires user:read)...');
    const adminUserRes = await apiCall('/users', { token: adminToken });
    if (adminUserRes.status === 401 || adminUserRes.status === 403) {
      throw new Error(`Admin unexpectedly denied access to /users: status ${adminUserRes.status}`);
    }
    console.log(`   ✅ Admin successfully authorized with permission user:read (Status ${adminUserRes.status}).`);

    // Test 7: Admin calling GET /dashboard/admin (requires analytics:view)
    console.log('\n7️⃣  Testing Admin Authorized on GET /dashboard/admin (requires analytics:view)...');
    const adminDashRes = await apiCall('/dashboard/admin', { token: adminToken });
    if (adminDashRes.status === 401 || adminDashRes.status === 403) {
      throw new Error(`Admin unexpectedly denied access to /dashboard/admin: status ${adminDashRes.status}`);
    }
    console.log(`   ✅ Admin successfully authorized for dashboard analytics (Status ${adminDashRes.status}).`);

    // Test 8: Trainee calling GET /dashboard/admin (requires ADMIN role & analytics:view)
    console.log('\n8️⃣  Testing Trainee Blocked from GET /dashboard/admin...');
    const traineeAdminDashRes = await apiCall('/dashboard/admin', { token: traineeToken });
    if (traineeAdminDashRes.status !== 403) {
      throw new Error(`Expected 403 for Trainee on /dashboard/admin, got ${traineeAdminDashRes.status}`);
    }
    console.log('   ✅ Trainee blocked with 403 Forbidden.');

    console.log('\n======================================================');
    console.log('🎉 ALL 8 REAL HTTP RBAC API INTEGRATION TESTS PASSED!');
    console.log('======================================================');
  } finally {
    testServer.close();
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runRbacApiIntegrationTests().catch((e) => {
  console.error('\n❌ RBAC API Integration Verification Failed:', e);
  process.exit(1);
});
