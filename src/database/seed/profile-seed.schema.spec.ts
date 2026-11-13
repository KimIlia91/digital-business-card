import { profileData } from './data/profile.data.js';
import {
  profileSeedSchema,
  type ProfileSeedInput,
} from './profile-seed.schema.js';

const validCard = (): ProfileSeedInput => ({
  slug: 'jane-doe',
  name: 'Jane Doe',
  headline: 'Backend Developer',
  description: 'Builds APIs.',
  links: [{ kind: 'GITHUB', label: 'GitHub', url: 'https://github.com/jane' }],
  skills: [
    { name: 'TypeScript', category: 'LANGUAGE' },
    { name: 'PostgreSQL', category: 'DATABASE' },
  ],
  experience: [
    {
      company: 'Acme',
      position: 'Developer',
      startDate: '2020-01-01',
      endDate: '2022-06-30',
      technologies: ['TypeScript'],
    },
  ],
  projects: [
    {
      name: 'Card',
      repositoryUrl: 'https://github.com/jane/card',
      technologies: ['PostgreSQL'],
    },
  ],
});

type Card = ProfileSeedInput;

const issuesAfter = (change: (card: Card) => void): string[] => {
  const card = validCard();
  change(card);
  return issuesOf(card);
};

const pathsAfter = (change: (card: Card) => void): PropertyKey[][] => {
  const card = validCard();
  change(card);
  const result = profileSeedSchema.safeParse(card);
  return result.success ? [] : result.error.issues.map((issue) => issue.path);
};

const addOrphanProject = (card: Card) => {
  card.projects.push({ name: 'Orphan' });
};

const issuesOf = (input: unknown): string[] => {
  const result = profileSeedSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('profileSeedSchema', () => {
  it('accepts the seed data shipped with the application', () => {
    expect(issuesOf(profileData)).toEqual([]);
  });

  it('parses dates and fills defaults', () => {
    const [position] = profileSeedSchema.parse(validCard()).experience;

    expect(position?.startDate).toEqual(new Date('2020-01-01T00:00:00.000Z'));
    expect(position?.achievements).toEqual([]);
  });

  it('rejects a technology that is not listed in skills', () => {
    expect(
      issuesAfter((card) => {
        card.projects[0]!.technologies = ['Kotlin'];
      }),
    ).toEqual(['Unknown technology "Kotlin": add it to "skills" first']);
  });

  it('rejects a technology listed twice for one entry', () => {
    expect(
      issuesAfter((card) => {
        card.experience[0]!.technologies = ['TypeScript', 'TypeScript'];
      }),
    ).toEqual(['Technology "TypeScript" is listed twice']);
  });

  it('rejects an end date earlier than the start date', () => {
    expect(
      issuesAfter((card) => {
        card.experience[0]!.endDate = '2019-12-31';
      }),
    ).toEqual(['endDate must not be earlier than startDate']);
  });

  it('rejects duplicates of everything the database keeps unique', () => {
    const issues = issuesAfter((card) => {
      card.skills.push({ name: 'TypeScript', category: 'LANGUAGE' });
      card.links.push({
        kind: 'WEBSITE',
        label: 'Site',
        url: 'https://github.com/jane',
      });
      card.projects.push({
        name: 'Card',
        url: 'https://example.com',
        technologies: [],
      });
      card.experience.push({ ...card.experience[0]!, endDate: '2023-01-01' });
    });

    expect(issues).toEqual([
      'Duplicate skill "TypeScript"',
      'Duplicate link "https://github.com/jane"',
      'Duplicate project "Card"',
      'Duplicate position "Acme / Developer / 2020-01-01"',
    ]);
  });

  it('accepts a project with only a url', () => {
    expect(
      issuesAfter((card) => {
        card.projects[0] = { name: 'Card', url: 'https://example.com' };
      }),
    ).toEqual([]);
  });

  it('accepts a project with only a repositoryUrl', () => {
    expect(
      issuesAfter((card) => {
        card.projects[0] = {
          name: 'Card',
          repositoryUrl: 'https://github.com/jane/card',
        };
      }),
    ).toEqual([]);
  });

  it('accepts a project with both a url and a repositoryUrl', () => {
    expect(
      issuesAfter((card) => {
        card.projects[0] = {
          name: 'Card',
          url: 'https://example.com',
          repositoryUrl: 'https://github.com/jane/card',
        };
      }),
    ).toEqual([]);
  });

  it('rejects a project with neither a url nor a repositoryUrl', () => {
    expect(issuesAfter(addOrphanProject)).toEqual([
      'Project "Orphan" needs a "url" or a "repositoryUrl"',
    ]);
    expect(pathsAfter(addOrphanProject)).toEqual([['projects', 1]]);
  });

  it('accepts an https avatar URL', () => {
    expect(
      issuesAfter((card) => {
        card.avatarUrl = 'https://example.com/a.png';
      }),
    ).toEqual([]);
  });

  it('rejects a non-http avatar URL', () => {
    expect(
      issuesAfter((card) => {
        card.avatarUrl = 'ftp://example.com/a.png';
      }),
    ).toHaveLength(1);
  });

  it('accepts a tel: link', () => {
    expect(
      issuesAfter((card) => {
        card.links.push({
          kind: 'OTHER',
          label: 'Phone',
          url: 'tel:+996709249884',
        });
      }),
    ).toEqual([]);
  });

  it('rejects a link with an unsupported protocol', () => {
    expect(
      issuesAfter((card) => {
        card.links[0]!.url = 'javascript:alert(1)';
      }),
    ).toHaveLength(1);
  });

  it('accepts the FRONTEND skill category', () => {
    expect(
      issuesAfter((card) => {
        card.skills.push({ name: 'React', category: 'FRONTEND' });
      }),
    ).toEqual([]);
  });

  it('rejects malformed slugs, impossible dates and unsafe links', () => {
    const issues = issuesAfter((card) => {
      card.slug = 'Jane Doe';
      card.experience[0]!.startDate = '2020-02-30';
      card.links[0]!.url = 'javascript:alert(1)';
    });

    expect(issues).toHaveLength(3);
  });
});
