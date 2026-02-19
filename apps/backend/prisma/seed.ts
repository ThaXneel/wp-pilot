import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create owner account
  const ownerPassword = await bcrypt.hash('owner123!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@wppilot.com' },
    update: {},
    create: {
      email: 'owner@wppilot.com',
      passwordHash: ownerPassword,
      role: 'OWNER',
      languagePreference: 'en',
      themePreference: 'system',
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  // Create test client 1
  const client1Password = await bcrypt.hash('client123!', 12);
  const client1User = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: {},
    create: {
      email: 'client1@example.com',
      passwordHash: client1Password,
      role: 'CLIENT',
      languagePreference: 'en',
      themePreference: 'dark',
      client: {
        create: {
          plan: 'STARTER',
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`✅ Client 1 created: ${client1User.email}`);

  // Create test client 2
  const client2Password = await bcrypt.hash('client123!', 12);
  const client2User = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {},
    create: {
      email: 'client2@example.com',
      passwordHash: client2Password,
      role: 'CLIENT',
      languagePreference: 'fr',
      themePreference: 'light',
      client: {
        create: {
          plan: 'GROWTH',
          status: 'ACTIVE',
        },
      },
    },
  });
  console.log(`✅ Client 2 created: ${client2User.email}`);

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
