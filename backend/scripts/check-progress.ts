import prisma from '../src/database/client';

async function checkCounts() {
  try {
    const courses = await prisma.course.count();
    const modules = await prisma.courseModule.count();
    const lessons = await prisma.lesson.count();
    const groups = await prisma.competencyGroup.count();
    const topics = await prisma.learningTopic.count();
    const events = await prisma.learningEvent.count();
    const userTopics = await prisma.userTopicCompetency.count();
    const skillGaps = await prisma.skillGap.count();
    const recommendations = await prisma.recommendation.count();
    console.log({ courses, modules, lessons, groups, topics, events, userTopics, skillGaps, recommendations });
  } catch (err: any) {
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounts();
