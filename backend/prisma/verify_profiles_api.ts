/// <reference path="../src/types/express.d.ts" />
import http from 'http';
import { AddressInfo } from 'net';
import { Role } from '@prisma/client';
import { app } from '../src/index';
import { TokenUtils } from '../src/auth/token.utils';
import { permissionsMap } from '../src/permissions';
import prisma from '../src/database/client';

async function runProfilesApiVerification() {
  console.log('============================================================');
  console.log('👤 STARTING PROFILES BACKEND HTTP VERIFICATION SUITE');
  console.log('============================================================\n');

  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Ephemeral test server active on port ${port}`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Fetch or prepare test users
    const existingTrainee = await prisma.user.findFirst({
      where: { role: Role.TRAINEE },
      include: { traineeProfile: true },
    });
    const traineeUserId = existingTrainee ? existingTrainee.id : 'trainee-test-uuid';
    const traineeEmail = existingTrainee ? existingTrainee.email : 'trainee.test@imd.gov.in';

    const traineeToken = TokenUtils.generateAccessToken({
      userId: traineeUserId,
      email: traineeEmail,
      role: Role.TRAINEE,
      permissions: permissionsMap[Role.TRAINEE] || [],
    });

    // Secondary trainee for cross-user ownership isolation testing
    let secondTrainee = await prisma.user.findFirst({
      where: { role: Role.TRAINEE, NOT: { id: traineeUserId } },
    });
    if (!secondTrainee) {
      // Create second trainee if missing
      const org = await prisma.organization.findFirst();
      secondTrainee = await prisma.user.create({
        data: {
          email: `second.trainee.${Date.now()}@imd.gov.in`,
          passwordHash: 'dummy-hash',
          firstName: 'Vikram',
          lastName: 'Singh',
          role: Role.TRAINEE,
          organizationId: org!.id,
          status: 'APPROVED',
        },
      });
    }

    const secondTraineeToken = TokenUtils.generateAccessToken({
      userId: secondTrainee.id,
      email: secondTrainee.email,
      role: Role.TRAINEE,
      permissions: permissionsMap[Role.TRAINEE] || [],
    });

    const existingTrainer = await prisma.user.findFirst({
      where: { role: Role.TRAINER },
      include: { trainerProfile: true },
    });
    const trainerUserId = existingTrainer ? existingTrainer.id : 'trainer-test-uuid';
    const trainerEmail = existingTrainer ? existingTrainer.email : 'trainer.test@imd.gov.in';

    const trainerToken = TokenUtils.generateAccessToken({
      userId: trainerUserId,
      email: trainerEmail,
      role: Role.TRAINER,
      permissions: permissionsMap[Role.TRAINER] || [],
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

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      return { status: res.status, body: json };
    };

    console.log('\n--- 1. Trainee Profile Core Operations ---');
    // 1.1 GET /trainee/profile
    const getProfileRes = await apiCall('/api/v1/trainee/profile', { token: traineeToken });
    assert(getProfileRes.status === 200, 'GET /api/v1/trainee/profile returns HTTP 200');
    assert(getProfileRes.body.success === true, 'Response body has success: true');
    assert(getProfileRes.body.data.userId === traineeUserId, 'Returned profile userId matches session identity');
    assert(getProfileRes.body.data.personalInfo.email === traineeEmail, 'Personal info contains sanitized email');
    assert(!getProfileRes.body.data.passwordHash, 'Response does NOT leak passwordHash');

    // 1.2 PATCH /trainee/profile
    const patchProfileRes = await apiCall('/api/v1/trainee/profile', {
      method: 'PATCH',
      token: traineeToken,
      body: {
        designation: 'Scientific Officer Grade-I',
        bio: 'Specialized researcher in atmospheric dynamics and cloud physics.',
        interests: ['Radar Meteorology', 'Numerical Modeling'],
      },
    });
    assert(patchProfileRes.status === 200, 'PATCH /api/v1/trainee/profile returns HTTP 200');
    assert(patchProfileRes.body.data.designation === 'Scientific Officer Grade-I', 'Designation updated properly');
    assert(Array.isArray(patchProfileRes.body.data.interests), 'Interests returned as array');
    assert(patchProfileRes.body.data.profileCompletion >= 40, 'Dynamic profileCompletion calculated and updated');

    console.log('\n--- 2. Skills Catalog & User Skills Operations ---');
    // 2.1 Available skills
    const availSkillsRes = await apiCall('/api/v1/trainee/skills/available', { token: traineeToken });
    assert(availSkillsRes.status === 200, 'GET /api/v1/trainee/skills/available returns HTTP 200');
    assert(Array.isArray(availSkillsRes.body.data.skills), 'Available skills returned as array');

    // 2.2 Add skill by name/ID
    const addSkillRes = await apiCall('/api/v1/trainee/skills', {
      method: 'POST',
      token: traineeToken,
      body: {
        skillName: 'Doppler Radar Calibration',
        proficiencyLevel: 4,
        yearsExperience: 3,
      },
    });
    assert(addSkillRes.status === 201, 'POST /api/v1/trainee/skills returns HTTP 201 Created');
    assert(addSkillRes.body.data.name === 'Doppler Radar Calibration', 'Skill mapped successfully with correct name');
    assert(addSkillRes.body.data.proficiencyLevel === 4, 'Proficiency level stored correctly');
    const addedSkillId = addSkillRes.body.data.skillId;

    // 2.3 List skills
    const listSkillsRes = await apiCall('/api/v1/trainee/skills', { token: traineeToken });
    assert(listSkillsRes.status === 200, 'GET /api/v1/trainee/skills returns HTTP 200');
    assert(listSkillsRes.body.data.some((s: any) => s.skillId === addedSkillId), 'Newly added skill exists in list');

    // 2.4 Delete skill
    const delSkillRes = await apiCall(`/api/v1/trainee/skills/${addedSkillId}`, {
      method: 'DELETE',
      token: traineeToken,
    });
    assert(delSkillRes.status === 200, 'DELETE /api/v1/trainee/skills/:skillId returns HTTP 200');

    console.log('\n--- 3. Qualifications CRUD Operations ---');
    // 3.1 Create Qualification
    const createQualRes = await apiCall('/api/v1/trainee/qualifications', {
      method: 'POST',
      token: traineeToken,
      body: {
        degree: 'M.Tech. Atmospheric Physics',
        fieldOfStudy: 'Atmospheric Sciences',
        institution: 'Indian Institute of Technology, Delhi',
        startDate: '2019-07-01T00:00:00.000Z',
        endDate: '2021-06-30T00:00:00.000Z',
        description: 'Thesis on Doppler radar synoptic integration.',
      },
    });
    assert(createQualRes.status === 201, 'POST /api/v1/trainee/qualifications returns HTTP 201');
    const qualId = createQualRes.body.data.id;
    assert(createQualRes.body.data.degree === 'M.Tech. Atmospheric Physics', 'Qualification degree matches');

    // 3.2 List Qualifications
    const listQualRes = await apiCall('/api/v1/trainee/qualifications', { token: traineeToken });
    assert(listQualRes.status === 200, 'GET /api/v1/trainee/qualifications returns HTTP 200');
    assert(listQualRes.body.data.some((q: any) => q.id === qualId), 'Created qualification in list');

    // 3.3 Update Qualification
    const updateQualRes = await apiCall(`/api/v1/trainee/qualifications/${qualId}`, {
      method: 'PUT',
      token: traineeToken,
      body: {
        institution: 'IIT Delhi — Department of Atmospheric Sciences',
      },
    });
    assert(updateQualRes.status === 200, 'PUT /api/v1/trainee/qualifications/:id returns HTTP 200');
    assert(updateQualRes.body.data.institution.includes('IIT Delhi'), 'Qualification updated successfully');

    // 3.4 Cross-User Ownership Isolation Test (Trainee B tries to modify Trainee A's qualification)
    const crossQualRes = await apiCall(`/api/v1/trainee/qualifications/${qualId}`, {
      method: 'PUT',
      token: secondTraineeToken,
      body: { institution: 'Malicious Hijack Institute' },
    });
    assert(
      crossQualRes.status === 404,
      'Cross-user modification rejected with HTTP 404 (Ownership Isolation verified)',
    );

    // 3.5 Delete Qualification
    const delQualRes = await apiCall(`/api/v1/trainee/qualifications/${qualId}`, {
      method: 'DELETE',
      token: traineeToken,
    });
    assert(delQualRes.status === 200, 'DELETE /api/v1/trainee/qualifications/:id returns HTTP 200');

    console.log('\n--- 4. Work Experience CRUD Operations ---');
    // 4.1 Create Work Experience
    const createExpRes = await apiCall('/api/v1/trainee/experience', {
      method: 'POST',
      token: traineeToken,
      body: {
        companyName: 'India Meteorological Department',
        jobTitle: 'Scientific Assistant',
        startDate: '2021-08-01T00:00:00.000Z',
        isCurrent: true,
        description: 'Operation of surface observation equipment and barometers.',
      },
    });
    assert(createExpRes.status === 201, 'POST /api/v1/trainee/experience returns HTTP 201');
    const expId = createExpRes.body.data.id;
    assert(createExpRes.body.data.jobTitle === 'Scientific Assistant', 'Experience jobTitle matches');

    // 4.2 Update Work Experience
    const updateExpRes = await apiCall(`/api/v1/trainee/experience/${expId}`, {
      method: 'PUT',
      token: traineeToken,
      body: {
        jobTitle: 'Senior Scientific Assistant',
      },
    });
    assert(updateExpRes.status === 200, 'PUT /api/v1/trainee/experience/:id returns HTTP 200');
    assert(updateExpRes.body.data.jobTitle === 'Senior Scientific Assistant', 'Job title updated successfully');

    // 4.3 Delete Work Experience
    const delExpRes = await apiCall(`/api/v1/trainee/experience/${expId}`, {
      method: 'DELETE',
      token: traineeToken,
    });
    assert(delExpRes.status === 200, 'DELETE /api/v1/trainee/experience/:id returns HTTP 200');

    console.log('\n--- 5. Certificates CRUD Operations ---');
    // 5.1 Create Certificate
    const createCertRes = await apiCall('/api/v1/trainee/certificates', {
      method: 'POST',
      token: traineeToken,
      body: {
        title: 'WMO Synoptic Meteorology Certification',
        issuingOrganization: 'World Meteorological Organization',
        credentialId: 'WMO-SYN-2023-771',
        issueDate: '2023-05-15T00:00:00.000Z',
        certificateUrl: 'https://credentials.wmo.int/verify/771',
      },
    });
    assert(createCertRes.status === 201, 'POST /api/v1/trainee/certificates returns HTTP 201');
    const certId = createCertRes.body.data.id;
    assert(createCertRes.body.data.verificationStatus === 'PENDING', 'Certificate created with PENDING status');

    // 5.2 List Certificates
    const listCertRes = await apiCall('/api/v1/trainee/certificates', { token: traineeToken });
    assert(listCertRes.status === 200, 'GET /api/v1/trainee/certificates returns HTTP 200');
    assert(listCertRes.body.data.some((c: any) => c.id === certId), 'Created certificate in list');

    // 5.3 Delete Certificate
    const delCertRes = await apiCall(`/api/v1/trainee/certificates/${certId}`, {
      method: 'DELETE',
      token: traineeToken,
    });
    assert(delCertRes.status === 200, 'DELETE /api/v1/trainee/certificates/:id returns HTTP 200');

    console.log('\n--- 6. Trainer Profile Operations ---');
    // 6.1 GET /trainer/profile
    const getTrainerRes = await apiCall('/api/v1/trainer/profile', { token: trainerToken });
    assert(getTrainerRes.status === 200, 'GET /api/v1/trainer/profile returns HTTP 200');
    assert(getTrainerRes.body.data.user.id === trainerUserId, 'Trainer profile matches trainer user ID');
    assert(getTrainerRes.body.data.stats !== undefined, 'Trainer stats calculated and returned');

    // 6.2 PATCH /trainer/profile
    const patchTrainerRes = await apiCall('/api/v1/trainer/profile', {
      method: 'PATCH',
      token: trainerToken,
      body: {
        designation: 'Chief Meteorologist & Senior Instructor',
        bio: 'Instructional lead for Numerical Weather Prediction and high-performance computing.',
        yearsExperience: 15,
      },
    });
    assert(patchTrainerRes.status === 200, 'PATCH /api/v1/trainer/profile returns HTTP 200');
    assert(patchTrainerRes.body.data.designation === 'Chief Meteorologist & Senior Instructor', 'Trainer designation updated');

    // 6.3 Trainer Qualifications CRUD
    const trainerQualRes = await apiCall('/api/v1/trainer/qualifications', {
      method: 'POST',
      token: trainerToken,
      body: {
        degree: 'Ph.D. Atmospheric Physics',
        fieldOfStudy: 'Tropical Cyclone Modeling',
        institution: 'Indian Institute of Science, Bangalore',
        startDate: '2012-08-01T00:00:00.000Z',
        endDate: '2017-05-15T00:00:00.000Z',
      },
    });
    assert(trainerQualRes.status === 201, 'POST /api/v1/trainer/qualifications returns HTTP 201');
    const trainerQualId = trainerQualRes.body.data.id;

    const delTrainerQualRes = await apiCall(`/api/v1/trainer/qualifications/${trainerQualId}`, {
      method: 'DELETE',
      token: trainerToken,
    });
    assert(delTrainerQualRes.status === 200, 'DELETE /api/v1/trainer/qualifications/:id returns HTTP 200');

    console.log('\n--- 7. Security, Validation & Error Handling ---');
    // 7.1 Unauthenticated Request Rejection
    const unauthRes = await apiCall('/api/v1/trainee/profile');
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401 Unauthorized');

    // 7.2 Role Restriction (Trainee attempting trainer course creation)
    const forbiddenRes = await apiCall('/api/v1/trainer/courses', {
      method: 'POST',
      token: traineeToken,
      body: { title: 'Unauthorized Course', description: 'Testing RBAC', category: 'General' },
    });
    assert(forbiddenRes.status === 403, 'Trainee calling trainer courses rejected with HTTP 403 Forbidden');

    // 7.3 Invalid Date Validation (End date before start date)
    const invalidDateRes = await apiCall('/api/v1/trainee/qualifications', {
      method: 'POST',
      token: traineeToken,
      body: {
        degree: 'Invalid Degree',
        fieldOfStudy: 'Testing',
        institution: 'Test College',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2020-01-01T00:00:00.000Z', // Prior to start date
      },
    });
    assert(invalidDateRes.status === 400, 'Invalid date ordering rejected with HTTP 400 Bad Request');

    console.log('\n============================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified!`);
    console.log('============================================================\n');
  } finally {
    testServer.close();
  }
}

runProfilesApiVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification suite failed:', err);
    process.exit(1);
  });
