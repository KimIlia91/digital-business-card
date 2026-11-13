import { profileData } from '../src/database/seed/data/profile.data.js';
import { cardOfSize, fetchCard, timelineCard } from './fixtures/cards.js';
import { startTestApi, type TestApi } from './setup/test-api.js';

describe('Database initialization (e2e)', () => {
  let api: TestApi;

  const skillsOfProfile = (slug: string) =>
    api.prisma.skill.findMany({
      where: { profile: { slug } },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

  beforeAll(async () => {
    api = await startTestApi();
    await api.seed(profileData, true);
    await api.seed(timelineCard);
  });

  afterAll(async () => {
    await api?.close();
  });

  it('keeps ids stable when the seed runs again, and removes deleted entries', async () => {
    const card = cardOfSize('stable', 3);

    await api.seed(card);
    const before = await skillsOfProfile('stable');
    await api.seed(card);
    expect(await skillsOfProfile('stable')).toEqual(before);

    await api.seed({
      ...card,
      skills: card.skills.slice(1),
      experience: [],
      projects: [],
    });
    expect(await skillsOfProfile('stable')).toEqual(before.slice(1));
  });

  it('keeps exactly one owner: renaming the owner slug replaces the old card', async () => {
    await api.seed(cardOfSize('new-owner', 1), true);
    expect((await fetchCard(api, '')).slug).toBe('new-owner');
    expect(
      await api.prisma.profile.findUnique({
        where: { slug: profileData.slug },
      }),
    ).toBeNull();

    await api.seed(profileData, true);
    expect((await fetchCard(api, '')).slug).toBe(profileData.slug);
    expect(await api.prisma.profile.count({ where: { isOwner: true } })).toBe(
      1,
    );
  });

  it('enforces integrity rules in the database itself', async () => {
    const { id: profileId } = await api.prisma.profile.findUniqueOrThrow({
      where: { slug: 'timeline' },
    });

    await expect(
      api.prisma.experience.create({
        data: {
          profileId,
          company: 'Time Travel Inc.',
          position: 'Developer',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2021-01-01'),
        },
      }),
    ).rejects.toThrow(/experiences_period_check/);

    await expect(
      api.prisma.profile.create({
        data: {
          slug: 'Not A Slug',
          name: 'x',
          headline: 'x',
          description: 'x',
        },
      }),
    ).rejects.toThrow(/profiles_slug_format/);
  });
});
