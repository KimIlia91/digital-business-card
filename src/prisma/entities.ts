/** Feature code imports entities from here, not from `generated/`. */
export type {
  Experience as ExperienceEntity,
  Profile as ProfileEntity,
  ProfileLink as ProfileLinkEntity,
  Project as ProjectEntity,
  Skill as SkillEntity,
} from '../generated/prisma/client.js';
export { LinkKind, SkillCategory } from '../generated/prisma/enums.js';
