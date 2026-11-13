import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Profile } from '../profile/models/profile.model.js';
import { Skill, SkillCategory } from './models/skill.model.js';
import { SkillsByProfileLoader } from './skills.loaders.js';
import { SkillsService } from './skills.service.js';

@Resolver(() => Profile)
export class ProfileSkillsResolver {
  constructor(
    private readonly skillsService: SkillsService,
    private readonly skillsByProfile: SkillsByProfileLoader,
  ) {}

  @ResolveField(() => [Skill], { description: 'Skills in display order' })
  async skills(
    @Parent() profile: Profile,
    @Loaders() loaders: LoaderRegistry,
    @Args('category', {
      type: () => SkillCategory,
      nullable: true,
      description: 'Return only skills of this category',
    })
    category?: SkillCategory | null,
  ): Promise<Skill[]> {
    const skills = await loaders.get(this.skillsByProfile).load(profile.id);
    return this.skillsService.filterByCategory(skills, category);
  }
}
