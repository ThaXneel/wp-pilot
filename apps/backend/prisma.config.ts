import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env for local Prisma CLI usage; on Railway env vars are injected directly
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
