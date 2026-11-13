import { z } from 'zod';
import { LinkKind, SkillCategory } from '../../prisma/entities.js';

const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });
const linkUrl = z.url({ protocol: /^(https?|mailto|tel|tg)$/ });

/** `YYYY-MM-DD` to a Date at UTC midnight, as PostgreSQL `date` round-trips. */
const localDate = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const technologies = z.array(text).default([]);

type Path = (string | number)[];

/**
 * Object-level checks also run when a field failed its own validation, so a
 * date may still be the raw (invalid) string here.
 */
const isDate = (value: unknown): value is Date => value instanceof Date;
const dayOf = (value: unknown): string =>
  isDate(value) ? value.toISOString().slice(0, 10) : String(value);

/**
 * Every rule the database enforces is checked here first, so a typo fails the
 * seed with a message pointing at the entry instead of a constraint violation
 * that keeps the container restarting.
 */
export const profileSeedSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    name: text,
    headline: text,
    description: text,
    location: text.optional(),
    avatarUrl: httpUrl.optional(),
    links: z.array(
      z.object({ kind: z.enum(LinkKind), label: text, url: linkUrl }),
    ),
    skills: z
      .array(z.object({ name: text, category: z.enum(SkillCategory) }))
      .min(1),
    experience: z.array(
      z.object({
        company: text,
        position: text,
        location: text.optional(),
        startDate: localDate,
        endDate: localDate.optional(),
        summary: text.optional(),
        achievements: z.array(text).default([]),
        technologies,
      }),
    ),
    projects: z.array(
      z.object({
        name: text,
        description: text.optional(),
        url: httpUrl.optional(),
        repositoryUrl: httpUrl.optional(),
        technologies,
      }),
    ),
  })
  .superRefine((card, ctx) => {
    const reportDuplicates = (
      values: readonly string[],
      path: (index: number) => Path,
      describe: (value: string) => string,
    ) => {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (seen.has(value)) {
          ctx.addIssue({
            code: 'custom',
            path: path(index),
            message: describe(value),
          });
        }
        seen.add(value);
      });
    };

    const skillNames = new Set(card.skills.map((skill) => skill.name));
    const checkTechnologies = (names: readonly string[], path: Path) => {
      names.forEach((name, index) => {
        if (!skillNames.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'technologies', index],
            message: `Unknown technology "${name}": add it to "skills" first`,
          });
        }
      });
      reportDuplicates(
        names,
        (index) => [...path, 'technologies', index],
        (name) => `Technology "${name}" is listed twice`,
      );
    };

    reportDuplicates(
      card.skills.map((skill) => skill.name),
      (index) => ['skills', index, 'name'],
      (name) => `Duplicate skill "${name}"`,
    );
    reportDuplicates(
      card.links.map((link) => link.url),
      (index) => ['links', index, 'url'],
      (url) => `Duplicate link "${url}"`,
    );
    reportDuplicates(
      card.projects.map((project) => project.name),
      (index) => ['projects', index, 'name'],
      (name) => `Duplicate project "${name}"`,
    );
    reportDuplicates(
      card.experience.map(
        (position) =>
          `${position.company} / ${position.position} / ${dayOf(position.startDate)}`,
      ),
      (index) => ['experience', index],
      (key) => `Duplicate position "${key}"`,
    );

    card.experience.forEach((position, index) => {
      checkTechnologies(position.technologies, ['experience', index]);
      if (
        isDate(position.startDate) &&
        isDate(position.endDate) &&
        position.endDate < position.startDate
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['experience', index, 'endDate'],
          message: 'endDate must not be earlier than startDate',
        });
      }
    });
    card.projects.forEach((project, index) => {
      checkTechnologies(project.technologies, ['projects', index]);
      if (!project.url && !project.repositoryUrl) {
        ctx.addIssue({
          code: 'custom',
          path: ['projects', index],
          message: `Project "${project.name}" needs a "url" or a "repositoryUrl"`,
        });
      }
    });
  });

/** What the data file is written as (dates as strings, optional defaults). */
export type ProfileSeedInput = z.input<typeof profileSeedSchema>;
/** What the seed works with after validation and parsing. */
export type ProfileSeed = z.output<typeof profileSeedSchema>;
