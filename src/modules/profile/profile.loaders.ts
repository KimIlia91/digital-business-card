import { Injectable } from '@nestjs/common';
import { OneToManyLoader } from '../../common/dataloader/batch-loader.js';
import type { ProfileLinkEntity } from '../../prisma/entities.js';
import { ProfileService } from './profile.service.js';

@Injectable()
export class LinksByProfileLoader extends OneToManyLoader<
  number,
  ProfileLinkEntity
> {
  constructor(private readonly profiles: ProfileService) {
    super();
  }

  protected loadBatch(profileIds: readonly number[]) {
    return this.profiles.findLinksByProfileIds(profileIds);
  }
}
