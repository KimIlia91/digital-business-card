/** Seed entry point: `npm run db:seed` in development, scripts/entrypoint.sh in production. */
import { z } from 'zod';
import { databaseEnvSchema } from '../../config/env.schema.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createPgAdapter } from '../../prisma/pg-adapter.js';
import { profileData } from './data/profile.data.js';
import { profileSeedSchema } from './profile-seed.schema.js';
import { seedProfile } from './seed-profile.js';

async function main(): Promise<void> {
  const env = databaseEnvSchema.safeParse(process.env);
  if (!env.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(env.error)}`);
  }

  const card = profileSeedSchema.safeParse(profileData);
  if (!card.success) {
    throw new Error(
      `Invalid seed data in src/database/seed/data/profile.data.ts:\n${z.prettifyError(card.error)}`,
    );
  }

  const prisma = new PrismaClient({
    adapter: createPgAdapter(env.data, 'business-card-seed'),
  });
  try {
    const summary = await seedProfile(prisma, card.data, { owner: true });
    console.log(
      `Seeded profile "${card.data.slug}" (id ${summary.profileId}): ` +
        `${summary.links} links, ${summary.skills} skills, ` +
        `${summary.experience} positions, ${summary.projects} projects`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

try {
  await main();
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
