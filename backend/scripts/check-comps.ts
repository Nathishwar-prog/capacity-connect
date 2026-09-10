import prisma from '../src/database/client';

async function main() {
  const comps = await prisma.competency.findMany({ take: 20 });
  console.log('Competencies count:', comps.length);
  console.log('Sample competencies:', comps.slice(0, 10).map((c: any) => ({ id: c.id, name: c.name, code: c.code, category: c.category })));
  await prisma.$disconnect();
}

main().catch(console.error);
