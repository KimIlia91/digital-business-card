import { Module } from '@nestjs/common';
import { LinksByProfileLoader } from './profile.loaders.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileResolver } from './profile.resolver.js';
import { ProfileService } from './profile.service.js';

@Module({
  providers: [
    ProfileRepository,
    ProfileService,
    LinksByProfileLoader,
    ProfileResolver,
  ],
})
export class ProfileModule {}
