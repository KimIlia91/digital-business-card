import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Profile } from '../profile/models/profile.model.js';
import { ExperienceByProfileLoader } from './experience.loaders.js';
import { Experience } from './models/experience.model.js';

@Resolver(() => Profile)
export class ProfileExperienceResolver {
  constructor(
    private readonly experienceByProfile: ExperienceByProfileLoader,
  ) {}

  @ResolveField(() => [Experience], {
    description: 'Work history: current positions first, then most recent',
  })
  experience(
    @Parent() profile: Profile,
    @Loaders() loaders: LoaderRegistry,
  ): Promise<Experience[]> {
    return loaders.get(this.experienceByProfile).load(profile.id);
  }
}
