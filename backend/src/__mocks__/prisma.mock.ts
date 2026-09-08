import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
export { prismaMock };
export default prismaMock;
