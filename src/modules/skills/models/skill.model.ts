import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { SkillCategory as DbSkillCategory } from '../../../prisma/entities.js';

export const SkillCategory = {
  LANGUAGE: 'LANGUAGE',
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND',
  DATABASE: 'DATABASE',
  API: 'API',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  TESTING: 'TESTING',
  TOOLING: 'TOOLING',
  PRACTICE: 'PRACTICE',
} as const satisfies { [K in DbSkillCategory]: K };
export type SkillCategory = (typeof SkillCategory)[keyof typeof SkillCategory];

registerEnumType(SkillCategory, {
  name: 'SkillCategory',
  description: 'Group a skill belongs to on the card',
});

@ObjectType({ description: 'Professional skill or technology' })
export class Skill {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => SkillCategory)
  category: SkillCategory;
}
