import { Injectable } from '@nestjs/common';
import { groupBy } from '../../common/collections.js';
import type { SkillCategory, SkillEntity } from '../../prisma/entities.js';
import { SkillsRepository } from './skills.repository.js';

@Injectable()
export class SkillsService {
  constructor(private readonly skills: SkillsRepository) {}

  async findByProfileIds(
    profileIds: readonly number[],
  ): Promise<Map<number, SkillEntity[]>> {
    const skills = await this.skills.findByProfileIds(profileIds);
    return groupBy(skills, (skill) => skill.profileId);
  }

  /** Filters in memory to keep one batched query per request regardless of arguments. */
  filterByCategory(
    skills: readonly SkillEntity[],
    category?: SkillCategory | null,
  ): SkillEntity[] {
    return category
      ? skills.filter((skill) => skill.category === category)
      : [...skills];
  }
}
