import { Injectable } from '@nestjs/common';
import { OneToManyLoader } from '../../common/dataloader/batch-loader.js';
import type { ExperienceEntity, SkillEntity } from '../../prisma/entities.js';
import { ExperienceService } from './experience.service.js';

@Injectable()
export class ExperienceByProfileLoader extends OneToManyLoader<
  number,
  ExperienceEntity
> {
  constructor(private readonly experience: ExperienceService) {
    super();
  }

  protected loadBatch(profileIds: readonly number[]) {
    return this.experience.findByProfileIds(profileIds);
  }
}

@Injectable()
export class TechnologiesByExperienceLoader extends OneToManyLoader<
  number,
  SkillEntity
> {
  constructor(private readonly experience: ExperienceService) {
    super();
  }

  protected loadBatch(experienceIds: readonly number[]) {
    return this.experience.findTechnologiesByExperienceIds(experienceIds);
  }
}
