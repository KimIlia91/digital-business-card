import { Module } from '@nestjs/common';
import { ProfileSkillsResolver } from './profile-skills.resolver.js';
import { SkillsByProfileLoader } from './skills.loaders.js';
import { SkillsRepository } from './skills.repository.js';
import { SkillsService } from './skills.service.js';

@Module({
  providers: [
    SkillsRepository,
    SkillsService,
    SkillsByProfileLoader,
    ProfileSkillsResolver,
  ],
})
export class SkillsModule {}
