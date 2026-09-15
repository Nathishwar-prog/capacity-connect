import { prisma } from '../src/database/client';

async function run() {
  const courses = await prisma.course.findMany({
    where: { title: { contains: 'Forecasters', mode: 'insensitive' } },
    include: {
      modules: {
        include: { lessons: true },
        orderBy: { orderIndex: 'asc' },
      },
      enrollments: {
        include: { user: true },
      },
    },
  });

  console.log(`Found ${courses.length} Forecasters courses`);
  for (const course of courses) {
    console.log(`\nCourse ID: ${course.id}`);
    console.log(`Title: "${course.title}", Status: ${course.status}, TrainerId: ${course.trainerId}`);
    console.log(`Modules count: ${course.modules.length}`);
    for (const m of course.modules) {
      console.log(`  Module [${m.orderIndex}]: ${m.id} - "${m.title}" (${m.lessons.length} lessons)`);
      for (const l of m.lessons) {
        console.log(`    Lesson [${l.orderIndex}]: ${l.id} - "${l.title}"`);
      }
    }
    console.log(`Enrollments (${course.enrollments.length}):`);
    for (const e of course.enrollments) {
      console.log(`  User: ${e.userId} (${e.user?.email}) - ${e.user?.role} - Status: ${e.status}`);
    }
  }

  // Also check existing trainees in the system
  const trainees = await prisma.user.findMany({
    where: { role: 'TRAINEE' },
    select: { id: true, email: true, firstName: true, lastName: true },
    take: 5,
  });
  console.log(`\nSample Trainees in system:`, trainees);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
