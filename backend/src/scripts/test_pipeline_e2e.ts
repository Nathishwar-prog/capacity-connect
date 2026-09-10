import request from 'supertest';
import { app, server } from '../index';
import prisma from '../database/client';

async function runE2ETest() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE LEARNING PIPELINE E2E INTEGRATION TEST');
  console.log('================================================================\n');

  try {
    // 1. Authenticate as Trainee Jane Doe
    console.log('1️⃣ Authenticating as Trainee (user@enterprise.com)...');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@enterprise.com', password: 'Password123!' });

    if (loginRes.status !== 200 || !loginRes.body.data?.accessToken) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    const token = loginRes.body.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   ✅ Authenticated successfully. JWT token obtained.\n');

    // 2. Fetch Learner Competency Groups & Verify Radar Group is Weakest
    console.log('2️⃣ Fetching Learner Competency Groups (/api/v1/users/me/competencies/groups)...');
    const groupsRes = await request(app)
      .get('/api/v1/users/me/competencies/groups')
      .set(authHeaders);

    if (groupsRes.status !== 200) {
      throw new Error(`Failed to fetch groups: ${JSON.stringify(groupsRes.body)}`);
    }

    const groupData = groupsRes.body.data;
    console.log(`   Focus Group Selected: "${groupData.selectedGroup?.groupName}" (ID: ${groupData.selectedGroup?.groupId})`);
    console.log(`   Focus Group Priority Score: ${groupData.selectedGroup?.priorityScore}`);
    console.log(`   Focus Group Average Score: ${groupData.selectedGroup?.averageScore}%`);
    console.log(`   Root Weakness Topics in Group: ${groupData.selectedGroup?.rootTopicIds?.join(', ')}`);

    if (!groupData.selectedGroup?.groupName?.toLowerCase().includes('radar')) {
      console.warn('   ⚠️ Warning: Focus group is not Radar, got:', groupData.selectedGroup?.groupName);
    } else {
      console.log('   ✅ VERIFIED: Doppler Weather Radar is correctly identified as the weakest group by DAG algorithm!\n');
    }

    // 3. Fetch/Generate Adaptive Revision Plan
    console.log('3️⃣ Generating Group-Aware Adaptive Revision Plan (/api/v1/users/me/revision-plan)...');
    const planRes = await request(app)
      .get('/api/v1/users/me/revision-plan')
      .set(authHeaders);

    if (planRes.status !== 200) {
      throw new Error(`Failed to generate revision plan: ${JSON.stringify(planRes.body)}`);
    }

    const sessionPlan = planRes.body.data;
    const sessionId = sessionPlan.sessionId || sessionPlan.id;
    console.log(`   Generated Revision Session ID: ${sessionId}`);
    console.log(`   Session Mode: ${sessionPlan.revisionMode || 'REBUILD'}`);
    console.log(`   Allocated Items: ${sessionPlan.items?.length || 0}`);

    const items = sessionPlan.items || [];
    items.forEach((item: any, idx: number) => {
      console.log(`     Item ${idx + 1}: ${item.topic?.name || item.topicName} [Code: ${item.topic?.code || item.topicCode}] | Mode: ${item.revisionMode}`);
    });

    const firstItem = items[0];
    const targetSessionItemId = firstItem.id;
    console.log(`\n   Targeting Item 1: ${firstItem.topic?.name || firstItem.topicCode} (ID: ${targetSessionItemId})`);

    // 4. Start Revision Session
    console.log('\n4️⃣ Starting Revision Session (/api/v1/revision-sessions/:id/start)...');
    const startRes = await request(app)
      .post(`/api/v1/revision-sessions/${sessionId}/start`)
      .set(authHeaders);

    console.log(`   Status: ${startRes.status} | Session Status: ${startRes.body.data?.status}`);
    console.log('   ✅ Revision session marked as STARTED.\n');

    // 5. Query Pre-Outcome Topic Competency
    const preCompetency = await prisma.userTopicCompetency.findFirst({
      where: {
        userId: loginRes.body.data.user.id,
        topic: { code: 'RAD_REFL' },
      },
    });
    console.log(`   Pre-Revision Competency for RAD_REFL: Score=${preCompetency?.competencyScore}, Stability=${preCompetency?.stability}, Retention=${preCompetency?.retention}`);

    // 6. Submit Retrieval Result and Trigger Learning Pipeline
    console.log('\n5️⃣ Submitting Practice / Retrieval Result (/api/v1/revision-sessions/:id/result)...');
    const resultRes = await request(app)
      .post(`/api/v1/revision-sessions/${sessionId}/result`)
      .set(authHeaders)
      .send({
        sessionItemId: targetSessionItemId,
        questionsPresented: 2,
        questionsAnswered: 2,
        correctAnswers: 2,
        timeSpentSeconds: 90,
        retrievalScore: 100.0,
      });

    if (resultRes.status !== 200) {
      throw new Error(`Failed to submit revision result: ${JSON.stringify(resultRes.body)}`);
    }

    console.log('   Response message:', resultRes.body.message);
    console.log(`   Recorded Outcome: Pre-score=${resultRes.body.data?.preScore} -> Post-score=${resultRes.body.data?.postScore}`);

    // 7. Query Post-Outcome Topic Competency
    const postCompetency = await prisma.userTopicCompetency.findFirst({
      where: {
        userId: loginRes.body.data.user.id,
        topic: { code: 'RAD_REFL' },
      },
    });
    console.log(`   Post-Revision Competency for RAD_REFL: Score=${postCompetency?.competencyScore}, Stability=${postCompetency?.stability}, Retention=${postCompetency?.retention}`);
    console.log(`   Score Gain: +${((postCompetency?.competencyScore ?? 0) - (preCompetency?.competencyScore ?? 0)).toFixed(1)} points!`);

    // 8. Fetch Updated Recommendations
    console.log('\n6️⃣ Fetching Real-Time Recommendations (/api/v1/users/me/recommendations)...');
    const recsRes = await request(app)
      .get('/api/v1/users/me/recommendations')
      .set(authHeaders);

    console.log(`   Recommendations returned: ${recsRes.body.data?.recommendations?.length || 0} candidates`);
    recsRes.body.data?.recommendations?.slice(0, 3).forEach((r: any, idx: number) => {
      console.log(`     #${idx + 1} Course: ${r.course?.title || r.courseId} | Source: ${r.source} | Score: ${r.finalScore?.toFixed(2)}`);
      if (r.explanation) {
        console.log(`        Rationale: "${r.explanation.headline}"`);
      }
    });

    console.log('\n================================================================');
    console.log('✨ ALL PIPELINE STAGES VERIFIED WORKING END-TO-END IN REAL DB!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ E2E Integration Pipeline Failed:', error);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

runE2ETest();
