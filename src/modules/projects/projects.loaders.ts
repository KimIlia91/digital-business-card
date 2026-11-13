import { Injectable } from '@nestjs/common';
import { OneToManyLoader } from '../../common/dataloader/batch-loader.js';
import type { ProjectEntity, SkillEntity } from '../../prisma/entities.js';
import { ProjectsService } from './projects.service.js';

@Injectable()
export class ProjectsByProfileLoader extends OneToManyLoader<
  number,
  ProjectEntity
> {
  constructor(private readonly projects: ProjectsService) {
    super();
  }

  protected loadBatch(profileIds: readonly number[]) {
    return this.projects.findByProfileIds(profileIds);
  }
}

@Injectable()
export class TechnologiesByProjectLoader extends OneToManyLoader<
  number,
  SkillEntity
> {
  constructor(private readonly projects: ProjectsService) {
    super();
  }

  protected loadBatch(projectIds: readonly number[]) {
    return this.projects.findTechnologiesByProjectIds(projectIds);
  }
}
