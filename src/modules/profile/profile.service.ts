import { Injectable } from '@nestjs/common';
import { groupBy } from '../../common/collections.js';
import type {
  ProfileEntity,
  ProfileLinkEntity,
} from '../../prisma/entities.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  /** Without a slug returns the owner's card, so renaming the slug never makes `profile` return null. */
  findBySlug(slug?: string | null): Promise<ProfileEntity | null> {
    const normalized = slug?.trim().toLowerCase();
    return normalized
      ? this.profiles.findBySlug(normalized)
      : this.profiles.findOwner();
  }

  async findLinksByProfileIds(
    profileIds: readonly number[],
  ): Promise<Map<number, ProfileLinkEntity[]>> {
    const links = await this.profiles.findLinksByProfileIds(profileIds);
    return groupBy(links, (link) => link.profileId);
  }
}
