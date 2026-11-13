import { Injectable } from '@nestjs/common';
import type { SkillEntity } from '../../prisma/entities.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: readonly number[]): Promise<SkillEntity[]> {
    return this.prisma.skill.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }
}
