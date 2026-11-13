import { Injectable } from '@nestjs/common';
import { OneToManyLoader } from '../../common/dataloader/batch-loader.js';
import type { SkillEntity } from '../../prisma/entities.js';
import { SkillsService } from './skills.service.js';

@Injectable()
export class SkillsByProfileLoader extends OneToManyLoader<
  number,
  SkillEntity
> {
  constructor(private readonly skills: SkillsService) {
    super();
  }

  protected loadBatch(profileIds: readonly number[]) {
    return this.skills.findByProfileIds(profileIds);
  }
}
