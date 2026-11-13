import { Injectable } from '@nestjs/common';
import type {
  ProfileEntity,
  ProfileLinkEntity,
} from '../../prisma/entities.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<ProfileEntity | null> {
    return this.prisma.profile.findUnique({ where: { slug } });
  }

  findOwner(): Promise<ProfileEntity | null> {
    return this.prisma.profile.findFirst({
      where: { isOwner: true },
      orderBy: { id: 'asc' },
    });
  }

  findLinksByProfileIds(
    profileIds: readonly number[],
  ): Promise<ProfileLinkEntity[]> {
    return this.prisma.profileLink.findMany({
      where: { profileId: { in: [...profileIds] } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }
}
