import { Injectable } from '@nestjs/common';
import { groupBy } from '../../common/collections.js';
import type { ExperienceEntity, SkillEntity } from '../../prisma/entities.js';
import { ExperienceRepository } from './experience.repository.js';

@Injectable()
export class ExperienceService {
  constructor(private readonly experience: ExperienceRepository) {}

  async findByProfileIds(
    profileIds: readonly number[],
  ): Promise<Map<number, ExperienceEntity[]>> {
    const positions = await this.experience.findByProfileIds(profileIds);
    return groupBy(positions, (position) => position.profileId);
  }

  async findTechnologiesByExperienceIds(
    experienceIds: readonly number[],
  ): Promise<Map<number, SkillEntity[]>> {
    const rows = await this.experience.findTechnologies(experienceIds);
    return new Map(rows.map((row) => [row.id, row.technologies]));
  }

  /** Current: no end date or ends in the future. Compared as UTC calendar days, like `date` columns. */
  isCurrent(
    position: Pick<ExperienceEntity, 'endDate'>,
    today: Date = new Date(),
  ): boolean {
    if (position.endDate === null) {
      return true;
    }
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    return position.endDate.getTime() >= todayUtc;
  }
}
