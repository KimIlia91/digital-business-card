import { Injectable } from '@nestjs/common';
import { groupBy } from '../../common/collections.js';
import type { ProjectEntity, SkillEntity } from '../../prisma/entities.js';
import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projects: ProjectsRepository) {}

  async findByProfileIds(
    profileIds: readonly number[],
  ): Promise<Map<number, ProjectEntity[]>> {
    const projects = await this.projects.findByProfileIds(profileIds);
    return groupBy(projects, (project) => project.profileId);
  }

  async findTechnologiesByProjectIds(
    projectIds: readonly number[],
  ): Promise<Map<number, SkillEntity[]>> {
    const rows = await this.projects.findTechnologies(projectIds);
    return new Map(rows.map((row) => [row.id, row.technologies]));
  }
}
