import { Injectable } from '@nestjs/common';
import type { ProjectEntity, SkillEntity } from '../../prisma/entities.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ProjectTechnologies {
  id: number;
  technologies: SkillEntity[];
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: readonly number[]): Promise<ProjectEntity[]> {
    return this.prisma.project.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findTechnologies(
    projectIds: readonly number[],
  ): Promise<ProjectTechnologies[]> {
    return this.prisma.project.findMany({
      where: { id: { in: [...projectIds] } },
      select: {
        id: true,
        technologies: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      },
    });
  }
}
