import type { ProfileSeedInput } from '../../src/database/seed/profile-seed.schema.js';
import type { TestApi } from '../setup/test-api.js';

/** The query from the assignment, verbatim. */
export const EXAMPLE_QUERY = /* GraphQL */ `
  query {
    profile {
      name
      description
      skills {
        name
      }
      experience {
        company
        position
      }
      projects {
        name
      }
    }
  }
`;

export const CARD_FIELDS = /* GraphQL */ `
  fragment CardFields on Profile {
    slug
    links {
      kind
      label
      url
    }
    skills {
      name
      category
    }
    experience {
      company
      startDate
      endDate
      isCurrent
      achievements
      technologies {
        name
      }
    }
    projects {
      name
      technologies {
        name
      }
    }
  }
`;

export interface Card {
  slug: string;
  links: { kind: string; label: string; url: string }[];
  skills: { name: string; category: string }[];
  experience: {
    company: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    achievements: string[];
    technologies: { name: string }[];
  }[];
  projects: { name: string; technologies: { name: string }[] }[];
}

/**
 * `size` entries in every list. Entry `i` uses its own technology, so data
 * delivered to the wrong parent would be visible.
 */
export function cardOfSize(slug: string, size: number): ProfileSeedInput {
  const range = Array.from({ length: size }, (_, index) => index);
  const skill = (i: number) => `${slug} skill ${i}`;
  return {
    slug,
    name: `Card ${slug}`,
    headline: 'Synthetic profile',
    description: 'Test fixture',
    links: range.map((i) => ({
      kind: 'WEBSITE',
      label: `Link ${i}`,
      url: `https://example.com/${slug}/${i}`,
    })),
    skills: range.map((i) => ({ name: skill(i), category: 'BACKEND' })),
    experience: range.map((i) => ({
      company: `${slug} company ${i}`,
      position: 'Developer',
      startDate: '2020-01-01',
      technologies: [skill(i)],
    })),
    projects: range.map((i) => ({
      name: `${slug} project ${i}`,
      repositoryUrl: `https://example.com/${slug}/project/${i}`,
      technologies: [skill(i)],
    })),
  };
}

export const timelineCard: ProfileSeedInput = {
  slug: 'timeline',
  name: 'Timeline',
  headline: 'Fixture',
  description: 'Ordering and dates',
  links: [
    { kind: 'GITHUB', label: 'GitHub', url: 'https://github.com/timeline' },
    { kind: 'EMAIL', label: 'Email', url: 'mailto:timeline@example.com' },
  ],
  skills: [
    { name: 'Go', category: 'LANGUAGE' },
    { name: 'SQL', category: 'DATABASE' },
    { name: 'Vitest', category: 'TESTING' },
  ],
  experience: [
    {
      company: 'Past',
      position: 'Junior',
      startDate: '2015-03-01',
      endDate: '2018-02-28',
      achievements: ['Shipped v1'],
    },
    { company: 'Current', position: 'Senior', startDate: '2022-06-01' },
    {
      company: 'Contract',
      position: 'Consultant',
      startDate: '2023-01-01',
      endDate: '2099-12-31',
    },
  ],
  projects: [
    { name: 'Second alphabetically', url: 'https://example.com/second' },
    { name: 'First alphabetically', url: 'https://example.com/first' },
  ],
};

export const fetchCard = async (api: TestApi, slug: string): Promise<Card> =>
  (
    await api.graphql<{ profile: Card }>(
      `
        query ($slug: String) {
          profile(slug: $slug) {
            ...CardFields
          }
        }
        ${CARD_FIELDS}
      `,
      { slug },
    )
  ).profile;
