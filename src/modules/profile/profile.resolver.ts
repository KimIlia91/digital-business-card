import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Profile } from './models/profile.model.js';
import { ProfileLink } from './models/profile-link.model.js';
import { LinksByProfileLoader } from './profile.loaders.js';
import { ProfileService } from './profile.service.js';

@Resolver(() => Profile)
export class ProfileResolver {
  constructor(
    private readonly profiles: ProfileService,
    private readonly linksByProfile: LinksByProfileLoader,
  ) {}

  @Query(() => Profile, {
    nullable: true,
    description:
      'Business card profile. Without `slug` returns the owner of the card.',
  })
  profile(
    @Args('slug', { type: () => String, nullable: true })
    slug?: string | null,
  ): Promise<Profile | null> {
    return this.profiles.findBySlug(slug);
  }

  @ResolveField(() => [ProfileLink], {
    description: 'GitHub, LinkedIn and other professional resources',
  })
  links(
    @Parent() profile: Profile,
    @Loaders() loaders: LoaderRegistry,
  ): Promise<ProfileLink[]> {
    return loaders.get(this.linksByProfile).load(profile.id);
  }
}
