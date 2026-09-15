import { prisma } from '../src/database/client';

async function checkColumns() {
  const res: any = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'assessments'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in assessments table:', res);
}

checkColumns()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
