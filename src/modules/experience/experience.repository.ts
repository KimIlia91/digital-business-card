import { Injectable } from '@nestjs/common';
import type { ExperienceEntity, SkillEntity } from '../../prisma/entities.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ExperienceTechnologies {
  id: number;
  technologies: SkillEntity[];
}

@Injectable()
export class ExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: readonly number[]): Promise<ExperienceEntity[]> {
    return this.prisma.experience.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [
        { endDate: { sort: 'desc', nulls: 'first' } },
        { startDate: 'desc' },
        { id: 'asc' },
      ],
    });
  }

  findTechnologies(
    experienceIds: readonly number[],
  ): Promise<ExperienceTechnologies[]> {
    return this.prisma.experience.findMany({
      where: { id: { in: [...experienceIds] } },
      select: {
        id: true,
        technologies: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      },
    });
  }
}
