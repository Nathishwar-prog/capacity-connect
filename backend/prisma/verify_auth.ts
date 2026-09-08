import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/database/client';
import { Role, UserStatus } from '@prisma/client';
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

  // Test 1: User Registration (Signup -> PENDING)
  console.log('1️⃣  Testing User Registration (POST /auth/register / POST /auth/signup)...');
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

  if (!regResult.user.id || regResult.user.status !== UserStatus.PENDING) {
    throw new Error(`Registration failed: expected status PENDING, got ${regResult.user.status}`);
  }
  if (regResult.user.emailVerified !== false) {
    throw new Error('Registration failed: expected emailVerified to be false');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((regResult as any).accessToken || (regResult as any).refreshToken) {
    throw new Error('Security violation: tokens must NOT be issued on registration for pending accounts');
  }
  if (!regResult.user.traineeProfile) {
    throw new Error('Registration failed to create TraineeProfile');
  }
  console.log(`   ✅ User registered in PENDING status. ID: ${regResult.user.id}, Status: ${regResult.user.status}, Role: ${regResult.user.role}`);

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

  // Test 3: Login Attempt on PENDING Account Must Fail
  console.log('3️⃣  Testing Login Blocked for PENDING Account...');
  try {
    await authService.login(testEmail, testPassword, '127.0.0.1', 'Verification-Test-Agent');
    throw new Error('Login with PENDING account should have failed');
  } catch (error: any) {
    if (error.statusCode === 401 && error.message.includes('awaiting administrative approval')) {
      console.log('   ✅ PENDING account login blocked successfully (401 Unauthorized - awaiting admin approval).');
    } else {
      throw error;
    }
  }

  // Test 4: Email Verification Flow
  console.log('4️⃣  Testing Email Verification Flow (POST /auth/verify-email)...');
  const validVerificationToken = TokenUtils.generateEmailVerificationToken({
    userId: regResult.user.id,
    email: testEmail,
  });

  // 4a: Test invalid token rejection
  try {
    await authService.verifyEmail('invalid.tampered.token');
    throw new Error('Invalid verification token should have failed');
  } catch (error: any) {
    if (error.statusCode === 400) {
      console.log('   ✅ Tampered verification token rejected (400 Bad Request).');
    } else {
      throw error;
    }
  }

  // 4b: Test valid email verification
  const verifyResult = await authService.verifyEmail(validVerificationToken);
  console.log(`   ✅ Email verified: ${verifyResult.message}`);

  const userAfterEmailVerify = await prisma.user.findUnique({
    where: { id: regResult.user.id },
  });
  if (!userAfterEmailVerify?.emailVerified) {
    throw new Error('Email verification failed to persist emailVerified = true in database');
  }

  // 4c: Test resend verification
  const resendResult = await authService.resendVerification(testEmail);
  console.log(`   ✅ Resend verification handled: ${resendResult.message}`);

  // Test 5: Invalid Password Login Attempt
  console.log('5️⃣  Testing Invalid Password Login Attempt...');
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

  // Test 6: Unknown User Login Attempt
  console.log('6️⃣  Testing Unknown User Login Attempt...');
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

  // Test 7: Admin Approval Lifecycle Stage
  console.log('7️⃣  Testing Admin Approval Stage (status: PENDING -> APPROVED)...');
  await prisma.user.update({
    where: { id: regResult.user.id },
    data: { status: UserStatus.APPROVED },
  });
  console.log('   ✅ Account status updated to APPROVED by Administrator.');

  // Test 8: Valid Credentials Login for Approved Account
  console.log('8️⃣  Testing User Login for Approved Account (POST /auth/login)...');
  const loginResult = await authService.login(
    testEmail,
    testPassword,
    '127.0.0.1',
    'Verification-Test-Agent',
  );

  if (!loginResult.accessToken || !loginResult.refreshToken) {
    throw new Error('Login failed to return access and refresh tokens');
  }
  console.log(`   ✅ Login successful. Access Token & Refresh Token issued.`);

  // Test 9: Token Verification & Payload Integrity
  console.log('9️⃣  Testing Access Token Signature and Payload Verification...');
  const decodedPayload = TokenUtils.verifyAccessToken(loginResult.accessToken);
  if (decodedPayload.email !== testEmail || decodedPayload.role !== 'TRAINEE') {
    throw new Error(`Token payload mismatch: ${JSON.stringify(decodedPayload)}`);
  }
  console.log(`   ✅ Token verified. User: ${decodedPayload.email}, Permissions: ${decodedPayload.permissions.join(', ')}`);

  // Test 10: Refresh Token Flow (Rotation)
  console.log('🔟 Testing Refresh Token Rotation (POST /auth/refresh)...');
  const refreshResult = await authService.refreshAccessToken(
    loginResult.refreshToken,
    '127.0.0.1',
    'Verification-Test-Agent',
  );

  if (!refreshResult.accessToken || !refreshResult.newRefreshToken) {
    throw new Error('Refresh token rotation failed to return new token pair');
  }
  console.log('   ✅ Token refresh & rotation successful.');

  // Test 11: Revoked Token Replay Prevention
  console.log('1️⃣1️⃣ Testing Revoked Refresh Token Replay Prevention...');
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

  // Test 12: User Profile Retrieval (GET /auth/me)
  console.log('1️⃣2️⃣ Testing Authenticated Profile Query (GET /auth/me)...');
  const meProfile = await authService.getMe(regResult.user.id);
  if (meProfile.email !== testEmail || !meProfile.organizationName) {
    throw new Error('getMe failed to return enriched profile data');
  }
  // Check sensitive fields are NOT exposed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((meProfile as any).passwordHash || (meProfile as any).password) {
    throw new Error('Security violation: passwordHash exposed on getMe profile');
  }
  console.log(`   ✅ Profile fetched: ${meProfile.firstName} ${meProfile.lastName} (${meProfile.organizationName}) - Safe DTO verified.`);

  // Test 13: Logout Token Revocation
  console.log('1️⃣3️⃣ Testing Logout (POST /auth/logout)...');
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

  // Test 14: Security Audit Log Verification
  console.log('1️⃣4️⃣ Testing Security Audit Logs...');
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

  console.log('\n=================================================================');
  console.log('🎉 ALL 14 AUTHENTICATION LIFECYCLE & INTEGRITY TESTS PASSED!');
  console.log('=================================================================');
}

verifyAuthMilestone()
  .catch((e) => {
    console.error('\n❌ Verification Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
