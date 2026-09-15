import { prisma } from '../src/database/client';

async function main() {
  const cols = await (prisma as any).$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'assessments'
    ORDER BY ordinal_position
  `);
  console.log('Assessments table columns in Neon DB:', (cols as any[]).map(c => c.column_name));
  const courses = await prisma.course.findMany({
    where: {
      title: { contains: 'Forecasters', mode: 'insensitive' },
    },
    include: {
      trainer: true,
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
      enrollments: {
        include: { user: true },
      },
      assessments: true,
    },
  });

  console.log(`Found ${courses.length} courses matching "Forecasters":`);
  for (const c of courses) {
    console.log(`\n========================================`);
    console.log(`Course ID: ${c.id}`);
    console.log(`Title: "${c.title}"`);
    console.log(`Status: ${c.status}`);
    console.log(`Trainer: ${c.trainer ? `${c.trainer.id} (${c.trainer.email})` : 'None'}`);
    console.log(`Modules count: ${c.modules.length}`);
    let totalLessons = 0;
    c.modules.forEach((m, idx) => {
      totalLessons += m.lessons.length;
      console.log(`  Module ${idx + 1} (${m.id}): "${m.title}" -> ${m.lessons.length} lessons`);
      if (idx === 0) {
        m.lessons.forEach((l, lidx) => {
          console.log(`    Lesson ${lidx + 1} (${l.id}): "${l.title}"`);
        });
      }
    });
    console.log(`Total lessons: ${totalLessons}`);
    console.log(`Assessments count: ${c.assessments.length}`);
    c.assessments.forEach((a) => {
      console.log(`  Assessment: ${a.id} | Title: "${a.title}" | Status: ${a.status}`);
    });
    console.log(`Enrollments count: ${c.enrollments.length}`);
    c.enrollments.forEach((e) => {
      console.log(`  Enrolled: ${e.user.id} (${e.user.email}) | Status: ${e.status} | Role: ${e.user.role}`);
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
