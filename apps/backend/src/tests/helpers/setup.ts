import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean test database
  await prisma.$executeRawUnsafe('DELETE FROM "Activity"');
  await prisma.$executeRawUnsafe('DELETE FROM "ConnectToken"');
  await prisma.$executeRawUnsafe('DELETE FROM "ClientSite"');
  await prisma.$executeRawUnsafe('DELETE FROM "PasswordResetToken"');
  await prisma.$executeRawUnsafe('DELETE FROM "GlobalEvent"');
  await prisma.$executeRawUnsafe('DELETE FROM "Client"');
  await prisma.$executeRawUnsafe('DELETE FROM "User"');
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
