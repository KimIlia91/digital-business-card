import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Profile } from '../profile/models/profile.model.js';
import { Project } from './models/project.model.js';
import { ProjectsByProfileLoader } from './projects.loaders.js';

@Resolver(() => Profile)
export class ProfileProjectsResolver {
  constructor(private readonly projectsByProfile: ProjectsByProfileLoader) {}

  @ResolveField(() => [Project], { description: 'Portfolio in display order' })
  projects(
    @Parent() profile: Profile,
    @Loaders() loaders: LoaderRegistry,
  ): Promise<Project[]> {
    return loaders.get(this.projectsByProfile).load(profile.id);
  }
}
