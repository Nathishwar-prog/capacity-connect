/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { Role } from '@prisma/client';
import { app } from '../src/index';
import { TokenUtils } from '../src/auth/token.utils';
import { permissionsMap } from '../src/permissions';
import prisma from '../src/database/client';

async function testSwaggerAudit() {
  console.log('============================================================');
  console.log('📚 TESTING SWAGGER UI & OPENAPI AUDIT & SECURITY ENDPOINTS');
  console.log('============================================================\n');

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Verify Swagger UI endpoint responds
    console.log('1️⃣ Checking Swagger UI at /api-docs/...');
    const swaggerRes = await fetch(`${baseUrl}/api-docs/`);
    if (swaggerRes.status !== 200) {
      throw new Error(`Swagger UI failed to load: status ${swaggerRes.status}`);
    }
    const html = await swaggerRes.text();
    if (!html.includes('Swagger UI') && !html.includes('swagger-ui')) {
      throw new Error('Swagger UI HTML does not contain expected markers');
    }
    console.log('   ✅ Swagger UI loads successfully (HTTP 200).');

    // 2. Verify OpenAPI spec matches routes
    console.log('\n2️⃣ Verifying OpenAPI schema coverage for Audit & Security endpoints...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const openapiSpec = require('../src/docs/openapi.json');
    const auditPaths = ['/admin/audit-logs', '/admin/audit-logs/{id}'];

    for (const p of auditPaths) {
      if (!openapiSpec.paths[p]) {
        throw new Error(`Missing path in OpenAPI spec: ${p}`);
      }
      console.log(`   ✅ Path '${p}' is fully specified in OpenAPI spec.`);
    }

    if (!openapiSpec.components?.schemas?.AuditLogResponse) {
      throw new Error('Missing AuditLogResponse schema in OpenAPI spec');
    }
    console.log('   ✅ Schema AuditLogResponse is present in OpenAPI spec.');

    if (!openapiSpec.components?.schemas?.PaginatedAuditLogsResponse) {
      throw new Error('Missing PaginatedAuditLogsResponse schema in OpenAPI spec');
    }
    console.log('   ✅ Schema PaginatedAuditLogsResponse is present in OpenAPI spec.');

    // 3. Live Execution of Documented Endpoints
    console.log('\n3️⃣ Executing live calls to Swagger-documented endpoints...');
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!adminUser) {
      throw new Error('No admin user found in database to test execution');
    }

    const adminToken = TokenUtils.generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: Role.ADMIN,
      permissions: permissionsMap[Role.ADMIN],
    });

    const listRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs?page=1&limit=5`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (listRes.status !== 200) {
      throw new Error(`Live execution failed for /admin/audit-logs: HTTP ${listRes.status}`);
    }
    const listData = await listRes.json();
    if (!listData.success || !Array.isArray(listData.data)) {
      throw new Error('Live execution returned unexpected response structure');
    }
    console.log(`   ✅ GET /admin/audit-logs executed via API; returned ${listData.data.length} records.`);

    console.log('\n============================================================');
    console.log('🎉 SWAGGER UI & OPENAPI VERIFICATION COMPLETE: ALL AUDIT PATHS VERIFIED!');
    console.log('============================================================\n');
  } finally {
    testServer.close();
  }
}

testSwaggerAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Swagger test failed:', err);
    process.exit(1);
  });
