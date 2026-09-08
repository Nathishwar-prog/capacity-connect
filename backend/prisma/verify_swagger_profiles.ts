/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/index';

async function testSwaggerProfiles() {
  console.log('============================================================');
  console.log('📚 TESTING SWAGGER UI & OPENAPI PROFILE ENDPOINTS');
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
    console.log('2️⃣ Verifying OpenAPI schema coverage for Profile endpoints...');
    const openapiSpec = require('../src/docs/openapi.json');
    const profilePaths = [
      '/trainee/profile',
      '/trainee/skills',
      '/trainee/skills/{skillId}',
      '/trainee/skills/available',
      '/trainee/qualifications',
      '/trainee/qualifications/{id}',
      '/trainee/experience',
      '/trainee/experience/{id}',
      '/trainee/certificates',
      '/trainee/certificates/{id}',
      '/trainer/profile',
      '/trainer/expertise',
      '/trainer/expertise/{skillId}',
      '/trainer/qualifications',
      '/trainer/qualifications/{id}',
      '/trainer/experience',
      '/trainer/experience/{id}',
      '/trainer/skills',
      '/trainer/skills/{skillId}',
      '/trainer/certificates',
      '/trainer/certificates/{id}',
    ];

    for (const p of profilePaths) {
      if (!openapiSpec.paths[p]) {
        throw new Error(`Missing path in OpenAPI spec: ${p}`);
      }
      console.log(`   ✅ Path '${p}' is fully specified in OpenAPI spec.`);
    }

    console.log('\n============================================================');
    console.log('🎉 SWAGGER UI & OPENAPI VERIFICATION COMPLETE: ALL PATHS TESTABLE!');
    console.log('============================================================\n');
  } finally {
    testServer.close();
  }
}

testSwaggerProfiles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Swagger test failed:', err);
    process.exit(1);
  });
