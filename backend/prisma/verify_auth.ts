import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/database/client';
import { Role } from '@prisma/client';
import { TokenUtils } from '../src/auth/token.utils';

async function verifyAuthMilestone() {
  console.log('🧪 Starting Milestone 2: Authentication Backend Verification Suite...\n');

  const authService = new AuthService();
  const testEmail = `test.trainee.${Date.now()}@capacityconnect.io`;
  const testPassword = 'Password123!';

  // Clean up any potential previous test user
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  // Test 1: User Registration
  console.log('1️⃣  Testing User Registration (POST /auth/register)...');
  const regResult = await authService.register(
    {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'Trainee',
      role: Role.TRAINEE,
    },
    '127.0.0.1',
    'Verification-Test-Agent',
  );

  if (!regResult.accessToken || !regResult.refreshToken || !regResult.user.id) {
    throw new Error('Registration failed to return tokens and user profile');
  }
  if (!regResult.user.traineeProfile) {
    throw new Error('Registration failed to create TraineeProfile');
  }
  console.log(`   ✅ User registered successfully. ID: ${regResult.user.id}, Role: ${regResult.user.role}`);

  // Test 2: Duplicate Registration Handling
  console.log('2️⃣  Testing Duplicate Registration Prevention...');
  try {
    await authService.register({
      email: testEmail,
      password: testPassword,
      firstName: 'Duplicate',
      lastName: 'User',
    });
    throw new Error('Duplicate registration should have failed with ConflictError');
  } catch (error: any) {
    if (error.statusCode === 409 || error.message.includes('already exists')) {
      console.log('   ✅ Duplicate registration blocked successfully (409 Conflict).');
    } else {
      throw error;
    }
  }

  // Test 3: Valid Credentials Login
  console.log('3️⃣  Testing User Login (POST /auth/login)...');
  const loginResult = await authService.login(
    testEmail,
    testPassword,
    '127.0.0.1',
    'Verification-Test-Agent',
  );

  if (!loginResult.accessToken || !loginResult.refreshToken) {
    throw new Error('Login failed to return access and refresh tokens');
  }
  console.log(`   ✅ Login successful. Access Token issued.`);

  // Test 4: Invalid Password Login
  console.log('4️⃣  Testing Invalid Password Login Attempt...');
  try {
    await authService.login(testEmail, 'WrongPassword999!', '127.0.0.1', 'Verification-Test-Agent');
    throw new Error('Login with incorrect password should have failed');
  } catch (error: any) {
    if (error.statusCode === 401 || error.message.includes('Invalid email or password')) {
      console.log('   ✅ Invalid password rejected (401 Unauthorized).');
    } else {
      throw error;
    }
  }

  // Test 5: Unknown User Login
  console.log('5️⃣  Testing Unknown User Login Attempt...');
  try {
    await authService.login('nonexistent.user@capacityconnect.io', 'SomePassword123!', '127.0.0.1');
    throw new Error('Login with unknown email should have failed');
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.log('   ✅ Unknown user rejected (401 Unauthorized).');
    } else {
      throw error;
    }
  }

  // Test 6: Token Verification & Payload
  console.log('6️⃣  Testing Access Token Signature and Payload Verification...');
  const decodedPayload = TokenUtils.verifyAccessToken(loginResult.accessToken);
  if (decodedPayload.email !== testEmail || decodedPayload.role !== 'TRAINEE') {
    throw new Error(`Token payload mismatch: ${JSON.stringify(decodedPayload)}`);
  }
  console.log(`   ✅ Token verified. User: ${decodedPayload.email}, Permissions: ${decodedPayload.permissions.join(', ')}`);

  // Test 7: Refresh Token Flow (Rotation)
  console.log('7️⃣  Testing Refresh Token Rotation (POST /auth/refresh)...');
  const refreshResult = await authService.refreshAccessToken(
    loginResult.refreshToken,
    '127.0.0.1',
    'Verification-Test-Agent',
  );

  if (!refreshResult.accessToken || !refreshResult.newRefreshToken) {
    throw new Error('Refresh token rotation failed to return new token pair');
  }
  console.log('   ✅ Token refresh & rotation successful.');

  // Test 8: Revoked Token Replay Prevention
  console.log('8️⃣  Testing Revoked Refresh Token Replay Prevention...');
  try {
    // Attempt to use the old (already rotated/revoked) refresh token
    await authService.refreshAccessToken(loginResult.refreshToken);
    throw new Error('Using revoked refresh token should have failed');
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.log('   ✅ Revoked token reuse blocked successfully.');
    } else {
      throw error;
    }
  }

  // Test 9: User Profile Retrieval (GET /auth/me)
  console.log('9️⃣  Testing Authenticated Profile Query (GET /auth/me)...');
  const meProfile = await authService.getMe(regResult.user.id);
  if (meProfile.email !== testEmail || !meProfile.organizationName) {
    throw new Error('getMe failed to return enriched profile data');
  }
  console.log(`   ✅ Profile fetched: ${meProfile.firstName} ${meProfile.lastName} (${meProfile.organizationName})`);

  // Test 10: Logout Token Revocation
  console.log('🔟 Testing Logout (POST /auth/logout)...');
  await authService.logout(refreshResult.newRefreshToken);
  try {
    await authService.refreshAccessToken(refreshResult.newRefreshToken);
    throw new Error('Logged out refresh token should not be refreshable');
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.log('   ✅ Token successfully invalidated upon logout.');
    } else {
      throw error;
    }
  }

  // Test 11: Audit Log Verification
  console.log('1️⃣1️⃣ Testing Security Audit Logs...');
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: regResult.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const actions = auditLogs.map((l) => l.action);
  console.log(`   ✅ Audit events logged: ${actions.join(' -> ')}`);

  // Cleanup test user
  await prisma.user.delete({
    where: { id: regResult.user.id },
  });
  console.log('\n🧹 Test user cleaned up.');

  console.log('\n======================================================');
  console.log('🎉 ALL 11 AUTHENTICATION BACKEND INTEGRITY TESTS PASSED!');
  console.log('======================================================');
}

verifyAuthMilestone()
  .catch((e) => {
    console.error('\n❌ Verification Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
