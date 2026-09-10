import prisma from '../src/database/client';

async function ping() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('✅ Connected! Organizations count:', orgs.length);
  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

ping();
