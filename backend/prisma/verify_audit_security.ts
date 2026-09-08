/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { Role, UserStatus } from '@prisma/client';
import { app } from '../src/index';
import { TokenUtils } from '../src/auth/token.utils';
import { permissionsMap } from '../src/permissions';
import prisma from '../src/database/client';
import { AuditService } from '../src/services/audit.service';
import { AuditRepository } from '../src/repositories/audit.repository';
import { AuditSanitizer } from '../src/utils/audit-sanitizer.util';
import { AuditAction, SOURCE_AUDIT_EVENTS } from '../src/constants/audit.constants';

async function runAuditSecurityVerification() {
  console.log('============================================================');
  console.log('🛡️  STARTING AUDIT & SECURITY VERIFICATION SUITE');
  console.log('============================================================\n');

  // Launch test HTTP server instance on ephemeral port
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Test server listening on ephemeral port ${port}`);

  const auditService = new AuditService();
  const auditRepository = new AuditRepository();

  const createdUserIds: string[] = [];
  const createdAuditIds: string[] = [];
  const createdOrgIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // SETUP: Organizations and Test Identities
    // -------------------------------------------------------------
    console.log('\n🔧 Setting up test organizations and identities...');

    // Primary Org A (IMD)
    const orgA = await prisma.organization.upsert({
      where: { code: 'TEST_ORG_A' },
      update: {},
      create: {
        name: 'IMD Test Org Alpha',
        code: 'TEST_ORG_A',
      },
    });
    createdOrgIds.push(orgA.id);

    // Secondary Org B (IITM)
    const orgB = await prisma.organization.upsert({
      where: { code: 'TEST_ORG_B' },
      update: {},
      create: {
        name: 'MoES Test Org Beta',
        code: 'TEST_ORG_B',
      },
    });
    createdOrgIds.push(orgB.id);

    // Admin User for Org A
    const adminUserA = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        email: `admin.orga.${Date.now()}@capacityconnect.io`,
        passwordHash: '$2a$12$e993kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd',
        firstName: 'Alpha',
        lastName: 'Admin',
        role: Role.ADMIN,
        status: UserStatus.APPROVED,
        emailVerified: true,
      },
    });
    createdUserIds.push(adminUserA.id);

    // Admin User for Org B
    const adminUserB = await prisma.user.create({
      data: {
        organizationId: orgB.id,
        email: `admin.orgb.${Date.now()}@capacityconnect.io`,
        passwordHash: '$2a$12$e993kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd',
        firstName: 'Beta',
        lastName: 'Admin',
        role: Role.ADMIN,
        status: UserStatus.APPROVED,
        emailVerified: true,
      },
    });
    createdUserIds.push(adminUserB.id);

    // Super Admin User
    const superAdminUser = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        email: `superadmin.${Date.now()}@capacityconnect.io`,
        passwordHash: '$2a$12$e993kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd',
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        status: UserStatus.APPROVED,
        emailVerified: true,
      },
    });
    createdUserIds.push(superAdminUser.id);

    // Trainee User
    const traineeUser = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        email: `trainee.${Date.now()}@capacityconnect.io`,
        passwordHash: '$2a$12$e993kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd',
        firstName: 'Test',
        lastName: 'Trainee',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        emailVerified: true,
      },
    });
    createdUserIds.push(traineeUser.id);

    // Tokens
    const adminTokenA = TokenUtils.generateAccessToken({
      userId: adminUserA.id,
      email: adminUserA.email,
      role: Role.ADMIN,
      permissions: permissionsMap[Role.ADMIN],
    });

    const adminTokenB = TokenUtils.generateAccessToken({
      userId: adminUserB.id,
      email: adminUserB.email,
      role: Role.ADMIN,
      permissions: permissionsMap[Role.ADMIN],
    });

    const superAdminToken = TokenUtils.generateAccessToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      role: Role.SUPER_ADMIN,
      permissions: permissionsMap[Role.SUPER_ADMIN],
    });

    const traineeToken = TokenUtils.generateAccessToken({
      userId: traineeUser.id,
      email: traineeUser.email,
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

    // -------------------------------------------------------------
    // TEST SECTION 1: Audit Sanitization Engine & Sensitive Data
    // -------------------------------------------------------------
    console.log('\n1️⃣  Testing Audit Sanitizer Engine (Sensitive Data Protection)...');

    const rawSensitivePayload = {
      user: {
        email: 'officer@imd.gov.in',
        password: 'TopSecretPassword123!',
        passwordHash: '$2a$12$hashvalueexample',
        nestedTokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M',
          refreshToken: 'd3b07384d113edec49eaa6238ad5ff00',
          apiKey: 'CC-LIVE-SECRET-KEY-998877',
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig',
        },
      },
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig',
        cookie: 'sessionId=secret123; token=xyz',
      },
      safeField: 'Observational Meteorology Training',
      status: 'APPROVED',
    };

    const sanitized = AuditSanitizer.sanitize(rawSensitivePayload);
    const sanitizedJson = JSON.stringify(sanitized);

    if (sanitizedJson.includes('TopSecretPassword123!')) {
      throw new Error('FAILED: Password leaked in sanitized audit payload!');
    }
    if (sanitizedJson.includes('$2a$12$hashvalueexample')) {
      throw new Error('FAILED: passwordHash leaked in sanitized audit payload!');
    }
    if (sanitizedJson.includes('CC-LIVE-SECRET-KEY-998877')) {
      throw new Error('FAILED: apiKey leaked in sanitized audit payload!');
    }
    if (sanitizedJson.includes('d3b07384d113edec49eaa6238ad5ff00')) {
      throw new Error('FAILED: refreshToken leaked in sanitized audit payload!');
    }
    if (!sanitizedJson.includes('[REDACTED]')) {
      throw new Error('FAILED: Expected [REDACTED] marker was missing!');
    }
    if (sanitized.safeField !== 'Observational Meteorology Training') {
      throw new Error('FAILED: Non-sensitive fields were corrupted during sanitization!');
    }
    console.log('   ✅ PASS: AuditSanitizer successfully redacts passwords, passwordHash, JWT, refresh tokens, and API keys.');

    // -------------------------------------------------------------
    // TEST SECTION 2: Direct Audit Persistence via AuditRepository
    // -------------------------------------------------------------
    console.log('\n2️⃣  Testing Audit Infrastructure Persistence & Organization Association...');

    const repoLog = await auditRepository.createAuditLog({
      organizationId: orgA.id,
      userId: adminUserA.id,
      action: AuditAction.USER_APPROVED,
      entityType: 'USER',
      entityId: traineeUser.id,
      oldValues: { status: 'PENDING', password: 'SecretPassword!' },
      newValues: { status: 'APPROVED' },
      ipAddress: '127.0.0.1',
      userAgent: 'MoES-AuditTestRunner/1.0',
    });
    createdAuditIds.push(repoLog.id);

    if (!repoLog.id || repoLog.action !== AuditAction.USER_APPROVED) {
      throw new Error('FAILED: AuditLog record creation failed or action mismatch');
    }
    if (repoLog.organizationId !== orgA.id) {
      throw new Error('FAILED: AuditLog organizationId was not properly associated');
    }
    const oldValuesJson = JSON.stringify(repoLog.oldValues);
    if (oldValuesJson.includes('SecretPassword!')) {
      throw new Error('FAILED: Raw password was persisted to the database!');
    }
    console.log('   ✅ PASS: Audit record persisted with clean actor, entity, and sanitized metadata.');

    // -------------------------------------------------------------
    // TEST SECTION 3: The 6 Source-Defined Audit Events
    // -------------------------------------------------------------
    console.log('\n3️⃣  Testing All 6 Source-Defined Audit Events...');

    // Event 1: USER_APPROVED
    const logUserApproved = await auditService.logUserApproved(
      adminUserA.id,
      traineeUser.id,
      orgA.id,
      'PENDING',
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logUserApproved.id);
    if (logUserApproved.action !== 'USER_APPROVED') throw new Error('FAILED: USER_APPROVED action mismatch');
    console.log('   ✅ PASS: 1. USER_APPROVED event created and verified.');

    // Event 2: USER_REJECTED
    const logUserRejected = await auditService.logUserRejected(
      adminUserA.id,
      traineeUser.id,
      orgA.id,
      'PENDING',
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logUserRejected.id);
    if (logUserRejected.action !== 'USER_REJECTED') throw new Error('FAILED: USER_REJECTED action mismatch');
    console.log('   ✅ PASS: 2. USER_REJECTED event created and verified.');

    // Event 3: ROLE_CHANGED
    const logRoleChanged = await auditService.logRoleChanged(
      adminUserA.id,
      traineeUser.id,
      orgA.id,
      'TRAINEE',
      'TRAINER',
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logRoleChanged.id);
    if (logRoleChanged.action !== 'ROLE_CHANGED') throw new Error('FAILED: ROLE_CHANGED action mismatch');
    console.log('   ✅ PASS: 3. ROLE_CHANGED event created and verified.');

    // Event 4: ACCOUNT_SUSPENDED
    const logAccountSuspended = await auditService.logAccountSuspended(
      adminUserA.id,
      traineeUser.id,
      orgA.id,
      'APPROVED',
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logAccountSuspended.id);
    if (logAccountSuspended.action !== 'ACCOUNT_SUSPENDED') throw new Error('FAILED: ACCOUNT_SUSPENDED action mismatch');
    console.log('   ✅ PASS: 4. ACCOUNT_SUSPENDED event created and verified.');

    // Event 5: COURSE_APPROVAL (Audit infrastructure integration helper)
    const logCourseApproval = await auditService.logCourseApproval(
      adminUserA.id,
      '00000000-0000-0000-0000-000000000001',
      orgA.id,
      { oldStatus: 'PENDING_APPROVAL', newStatus: 'PUBLISHED', remarks: 'Curriculum verified against IMD WMO guidelines' },
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logCourseApproval.id);
    if (logCourseApproval.action !== 'COURSE_APPROVAL') throw new Error('FAILED: COURSE_APPROVAL action mismatch');
    console.log('   ✅ PASS: 5. COURSE_APPROVAL event helper verified.');

    // Event 6: CERTIFICATE_VERIFICATION (Audit infrastructure integration helper)
    const logCertVerification = await auditService.logCertificateVerification(
      adminUserA.id,
      '00000000-0000-0000-0000-000000000002',
      orgA.id,
      { oldStatus: 'PENDING', newStatus: 'VERIFIED', remarks: 'Accredited by WMO Regional Training Center' },
      { ipAddress: '192.168.1.10', userAgent: 'Chrome/120' },
    );
    createdAuditIds.push(logCertVerification.id);
    if (logCertVerification.action !== 'CERTIFICATE_VERIFICATION') throw new Error('FAILED: CERTIFICATE_VERIFICATION action mismatch');
    console.log('   ✅ PASS: 6. CERTIFICATE_VERIFICATION event helper verified.');

    // Verify all 6 source-defined audit events are tracked
    for (const evt of SOURCE_AUDIT_EVENTS) {
      const exists = await prisma.auditLog.findFirst({ where: { action: evt } });
      if (!exists) {
        throw new Error(`FAILED: Source-defined event '${evt}' missing from database!`);
      }
    }
    console.log('   ✅ PASS: All 6 source-defined events confirmed present in system.');

    // -------------------------------------------------------------
    // TEST SECTION 4: Integration with User Lifecycle Service
    // -------------------------------------------------------------
    console.log('\n4️⃣  Testing Live User Lifecycle Audit Integration via API...');

    // Create a fresh candidate user
    const candidateUser = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        email: `candidate.${Date.now()}@capacityconnect.io`,
        passwordHash: '$2a$12$e993kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd93kd',
        firstName: 'Candidate',
        lastName: 'User',
        role: Role.TRAINEE,
        status: UserStatus.PENDING,
        emailVerified: true,
      },
    });
    createdUserIds.push(candidateUser.id);

    // Admin approves user via HTTP
    const approveRes = await apiCall(`/api/v1/admin/users/${candidateUser.id}/approve`, {
      method: 'PATCH',
      token: adminTokenA,
    });
    if (approveRes.status !== 200) {
      throw new Error(`Approve user failed with status ${approveRes.status}`);
    }

    // Verify USER_APPROVED audit record was created by the service
    const approvedLog = await prisma.auditLog.findFirst({
      where: {
        entityId: candidateUser.id,
        action: AuditAction.USER_APPROVED,
      },
    });
    if (!approvedLog) {
      throw new Error('FAILED: USER_APPROVED audit record not generated by approval endpoint');
    }
    createdAuditIds.push(approvedLog.id);
    console.log('   ✅ PASS: User approval endpoint generated USER_APPROVED audit record.');

    // Admin suspends user via HTTP
    const suspendRes = await apiCall(`/api/v1/admin/users/${candidateUser.id}/status`, {
      method: 'PATCH',
      token: adminTokenA,
      body: { status: UserStatus.SUSPENDED },
    });
    if (suspendRes.status !== 200) {
      throw new Error(`Suspend user failed with status ${suspendRes.status}`);
    }

    const suspendedLog = await prisma.auditLog.findFirst({
      where: {
        entityId: candidateUser.id,
        action: AuditAction.ACCOUNT_SUSPENDED,
      },
    });
    if (!suspendedLog) {
      throw new Error('FAILED: ACCOUNT_SUSPENDED audit record not generated by suspend endpoint');
    }
    createdAuditIds.push(suspendedLog.id);
    console.log('   ✅ PASS: User status change to SUSPENDED generated ACCOUNT_SUSPENDED audit record.');

    // Admin updates role via HTTP
    const roleRes = await apiCall(`/api/v1/admin/users/${candidateUser.id}/role`, {
      method: 'PATCH',
      token: adminTokenA,
      body: { role: Role.TRAINER },
    });
    if (roleRes.status !== 200) {
      throw new Error(`Role update failed with status ${roleRes.status}`);
    }

    const roleLog = await prisma.auditLog.findFirst({
      where: {
        entityId: candidateUser.id,
        action: AuditAction.ROLE_CHANGED,
      },
    });
    if (!roleLog) {
      throw new Error('FAILED: ROLE_CHANGED audit record not generated by role update endpoint');
    }
    createdAuditIds.push(roleLog.id);
    console.log('   ✅ PASS: User role update generated ROLE_CHANGED audit record.');

    // -------------------------------------------------------------
    // TEST SECTION 5: Audit API Authorization & RBAC
    // -------------------------------------------------------------
    console.log('\n5️⃣  Testing Administrative Audit API Authorization...');

    // Unauthenticated access rejected with 401
    const unauthRes = await apiCall('/api/v1/admin/audit-logs');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   ✅ PASS: Unauthenticated request rejected with HTTP 401 Unauthorized.');

    // Trainee access rejected with 403
    const traineeRes = await apiCall('/api/v1/admin/audit-logs', { token: traineeToken });
    if (traineeRes.status !== 403) {
      throw new Error(`Expected 403 for Trainee role, got ${traineeRes.status}`);
    }
    console.log('   ✅ PASS: Trainee access rejected with HTTP 403 Forbidden.');

    // Authorized Admin receives 200 with structured paginated response
    const adminRes = await apiCall('/api/v1/admin/audit-logs?page=1&limit=10', {
      token: adminTokenA,
    });
    if (adminRes.status !== 200 || !adminRes.data.success) {
      throw new Error(`Expected 200 for Admin, got ${adminRes.status}`);
    }
    if (!Array.isArray(adminRes.data.data) || !adminRes.data.meta) {
      throw new Error('FAILED: Response structure missing data array or meta object');
    }
    console.log(`   ✅ PASS: Admin authorized; retrieved ${adminRes.data.data.length} audit logs with pagination metadata.`);

    // -------------------------------------------------------------
    // TEST SECTION 6: Multi-Tenant Organization Isolation
    // -------------------------------------------------------------
    console.log('\n6️⃣  Testing Multi-Tenant Organization Isolation...');

    // Create an audit record specifically for Org B
    const orgBLog = await auditRepository.createAuditLog({
      organizationId: orgB.id,
      userId: adminUserB.id,
      action: AuditAction.USER_APPROVED,
      entityType: 'USER',
      entityId: adminUserB.id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED' },
    });
    createdAuditIds.push(orgBLog.id);

    // Admin A queries audit logs -> must NOT see Org B records
    const adminAQuery = await apiCall('/api/v1/admin/audit-logs?limit=50', { token: adminTokenA });
    const containsOrgBRecord = adminAQuery.data.data.some((l: any) => l.organizationId === orgB.id);
    if (containsOrgBRecord) {
      throw new Error('CRITICAL SECURITY BREACH: Admin A saw audit logs belonging to Organization B!');
    }
    console.log('   ✅ PASS: Organization isolation verified on list query — Admin A cannot see Org B logs.');

    // Admin A attempts to fetch Org B audit log by specific ID -> must receive 404 Not Found
    const crossTenantGet = await apiCall(`/api/v1/admin/audit-logs/${orgBLog.id}`, { token: adminTokenA });
    if (crossTenantGet.status !== 404) {
      throw new Error(`CRITICAL SECURITY BREACH: Cross-tenant audit log fetch returned status ${crossTenantGet.status} instead of 404!`);
    }
    console.log('   ✅ PASS: Cross-tenant ID access strictly blocked with HTTP 404 Not Found.');

    // Admin B queries audit logs with adminTokenB -> CAN see Org B record
    const adminBQuery = await apiCall(`/api/v1/admin/audit-logs/${orgBLog.id}`, { token: adminTokenB });
    if (adminBQuery.status !== 200 || adminBQuery.data.data.id !== orgBLog.id) {
      throw new Error('FAILED: Admin B should have access to Org B audit record');
    }
    console.log('   ✅ PASS: Tenant owner Admin B successfully accesses their organization audit record.');

    // Super Admin queries audit logs -> has cross-organization visibility
    const superAdminQuery = await apiCall('/api/v1/admin/audit-logs?limit=100', { token: superAdminToken });
    const superAdminSeesOrgB = superAdminQuery.data.data.some((l: any) => l.organizationId === orgB.id);
    if (!superAdminSeesOrgB) {
      throw new Error('FAILED: Super Admin should have cross-organization audit visibility');
    }
    console.log('   ✅ PASS: Super Admin successfully retains global multi-organization governance visibility.');

    // -------------------------------------------------------------
    // TEST SECTION 7: Query Filters & Error Validation
    // -------------------------------------------------------------
    console.log('\n7️⃣  Testing Query Filtering, Pagination, and Error Handling...');

    // Filter by action
    const filteredActionRes = await apiCall('/api/v1/admin/audit-logs?action=USER_APPROVED', {
      token: adminTokenA,
    });
    if (filteredActionRes.status !== 200) {
      throw new Error('Action filter failed');
    }
    const nonApproved = filteredActionRes.data.data.filter((l: any) => l.action !== 'USER_APPROVED');
    if (nonApproved.length > 0) {
      throw new Error('FAILED: Action filter returned non-matching action records');
    }
    console.log('   ✅ PASS: Action filtering works accurately.');

    // Invalid UUID format for ID parameter
    const invalidIdRes = await apiCall('/api/v1/admin/audit-logs/invalid-uuid-1234', {
      token: adminTokenA,
    });
    if (invalidIdRes.status !== 400 && invalidIdRes.status !== 422) {
      throw new Error(`Expected 400/422 for invalid UUID param, got ${invalidIdRes.status}`);
    }
    console.log('   ✅ PASS: Malformed audit log UUID correctly rejected with validation error.');

    // Non-existent valid UUID returns 404
    const notFoundRes = await apiCall('/api/v1/admin/audit-logs/00000000-0000-0000-0000-000000000000', {
      token: adminTokenA,
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for non-existent audit record, got ${notFoundRes.status}`);
    }
    console.log('   ✅ PASS: Non-existent audit record properly returns 404 Not Found.');

    console.log('\n============================================================');
    console.log('🎉 ALL AUDIT & SECURITY VERIFICATION TESTS PASSED!');
    console.log('============================================================\n');
  } finally {
    // Teardown test artifacts
    console.log('🧹 Cleaning up test audit logs, users, and organizations...');
    if (createdAuditIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { id: { in: createdAuditIds } } }).catch(() => null);
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => null);
    }
    if (createdOrgIds.length > 0) {
      await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } }).catch(() => null);
    }
    testServer.close();
  }
}

runAuditSecurityVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Audit & Security verification failed:', err);
    process.exit(1);
  });
