import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean test database (table names match @@map in schema.prisma)
  await prisma.$executeRawUnsafe('DELETE FROM "activities"');
  await prisma.$executeRawUnsafe('DELETE FROM "connect_tokens"');
  await prisma.$executeRawUnsafe('DELETE FROM "client_sites"');
  await prisma.$executeRawUnsafe('DELETE FROM "password_reset_tokens"');
  await prisma.$executeRawUnsafe('DELETE FROM "global_events"');
  await prisma.$executeRawUnsafe('DELETE FROM "system_settings"');
  await prisma.$executeRawUnsafe('DELETE FROM "clients"');
  await prisma.$executeRawUnsafe('DELETE FROM "users"');
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
