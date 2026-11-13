import { Module } from '@nestjs/common';
import { ProfileProjectsResolver } from './profile-projects.resolver.js';
import {
  ProjectsByProfileLoader,
  TechnologiesByProjectLoader,
} from './projects.loaders.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsResolver } from './projects.resolver.js';
import { ProjectsService } from './projects.service.js';

@Module({
  providers: [
    ProjectsRepository,
    ProjectsService,
    ProjectsByProfileLoader,
    TechnologiesByProjectLoader,
    ProjectsResolver,
    ProfileProjectsResolver,
  ],
})
export class ProjectsModule {}
