import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { ProfileSeed } from './profile-seed.schema.js';

type Tx = Prisma.TransactionClient;

/** Arbitrary constant identifying the seed among advisory locks. */
const SEED_LOCK_ID = 7_270_001;

export interface SeedOptions {
  /** Marks the card as the owner's and removes the previous owner card after a slug rename. */
  owner?: boolean;
}

export interface SeedSummary {
  profileId: number;
  links: number;
  skills: number;
  experience: number;
  projects: number;
}

/**
 * Idempotent (runs on every start): upserts by natural key so ids stay stable,
 * in one transaction under an advisory lock. The lock goes through `$executeRaw`
 * because `$queryRaw` cannot deserialize its `void` result.
 */
export async function seedProfile(
  prisma: PrismaClient,
  card: ProfileSeed,
  { owner = false }: SeedOptions = {},
): Promise<SeedSummary> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '15s'`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SEED_LOCK_ID})`;

      const profileId = await syncProfile(tx, card, owner);
      const skillIds = await syncSkills(tx, profileId, card.skills);
      await syncLinks(tx, profileId, card.links);
      await syncExperience(tx, profileId, card.experience, skillIds);
      await syncProjects(tx, profileId, card.projects, skillIds);

      return {
        profileId,
        links: card.links.length,
        skills: card.skills.length,
        experience: card.experience.length,
        projects: card.projects.length,
      };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

async function syncProfile(
  tx: Tx,
  card: ProfileSeed,
  owner: boolean,
): Promise<number> {
  if (owner) {
    await tx.profile.deleteMany({
      where: { isOwner: true, slug: { not: card.slug } },
    });
  }
  const fields = {
    name: card.name,
    headline: card.headline,
    description: card.description,
    location: card.location ?? null,
    avatarUrl: card.avatarUrl ?? null,
  };
  const { id } = await tx.profile.upsert({
    where: { slug: card.slug },
    create: { slug: card.slug, isOwner: owner, ...fields },
    update: owner ? { ...fields, isOwner: true } : fields,
    select: { id: true },
  });
  return id;
}

async function syncSkills(
  tx: Tx,
  profileId: number,
  skills: ProfileSeed['skills'],
): Promise<Map<string, number>> {
  await tx.skill.deleteMany({
    where: { profileId, name: { notIn: skills.map((skill) => skill.name) } },
  });
  const ids = new Map<string, number>();
  for (const [sortOrder, skill] of skills.entries()) {
    const { id } = await tx.skill.upsert({
      where: { profileId_name: { profileId, name: skill.name } },
      create: {
        profileId,
        name: skill.name,
        category: skill.category,
        sortOrder,
      },
      update: { category: skill.category, sortOrder },
      select: { id: true },
    });
    ids.set(skill.name, id);
  }
  return ids;
}

async function syncLinks(
  tx: Tx,
  profileId: number,
  links: ProfileSeed['links'],
): Promise<void> {
  await tx.profileLink.deleteMany({
    where: { profileId, url: { notIn: links.map((link) => link.url) } },
  });
  for (const [sortOrder, link] of links.entries()) {
    await tx.profileLink.upsert({
      where: { profileId_url: { profileId, url: link.url } },
      create: { profileId, ...link, sortOrder },
      update: { kind: link.kind, label: link.label, sortOrder },
    });
  }
}

async function syncExperience(
  tx: Tx,
  profileId: number,
  positions: ProfileSeed['experience'],
  skillIds: ReadonlyMap<string, number>,
): Promise<void> {
  await tx.experience.deleteMany({
    where: {
      profileId,
      NOT: {
        OR: positions.map(({ company, position, startDate }) => ({
          company,
          position,
          startDate,
        })),
      },
    },
  });
  for (const position of positions) {
    const technologies = skillRefs(position.technologies, skillIds);
    const fields = {
      location: position.location ?? null,
      endDate: position.endDate ?? null,
      summary: position.summary ?? null,
      achievements: position.achievements,
    };
    await tx.experience.upsert({
      where: {
        profileId_company_position_startDate: {
          profileId,
          company: position.company,
          position: position.position,
          startDate: position.startDate,
        },
      },
      create: {
        profileId,
        company: position.company,
        position: position.position,
        startDate: position.startDate,
        ...fields,
        technologies: { connect: technologies },
      },
      update: { ...fields, technologies: { set: technologies } },
    });
  }
}

async function syncProjects(
  tx: Tx,
  profileId: number,
  projects: ProfileSeed['projects'],
  skillIds: ReadonlyMap<string, number>,
): Promise<void> {
  await tx.project.deleteMany({
    where: {
      profileId,
      name: { notIn: projects.map((project) => project.name) },
    },
  });
  for (const [sortOrder, project] of projects.entries()) {
    const technologies = skillRefs(project.technologies, skillIds);
    const fields = {
      description: project.description ?? null,
      url: project.url ?? null,
      repositoryUrl: project.repositoryUrl ?? null,
      sortOrder,
    };
    await tx.project.upsert({
      where: { profileId_name: { profileId, name: project.name } },
      create: {
        profileId,
        name: project.name,
        ...fields,
        technologies: { connect: technologies },
      },
      update: { ...fields, technologies: { set: technologies } },
    });
  }
}

function skillRefs(
  names: readonly string[],
  skillIds: ReadonlyMap<string, number>,
): { id: number }[] {
  return names.map((name) => {
    const id = skillIds.get(name);
    if (id === undefined) {
      throw new Error(`Unknown technology "${name}"`);
    }
    return { id };
  });
}
