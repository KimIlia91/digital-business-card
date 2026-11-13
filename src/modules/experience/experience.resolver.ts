import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Skill } from '../skills/models/skill.model.js';
import { TechnologiesByExperienceLoader } from './experience.loaders.js';
import { ExperienceService } from './experience.service.js';
import { Experience } from './models/experience.model.js';

@Resolver(() => Experience)
export class ExperienceResolver {
  constructor(
    private readonly experience: ExperienceService,
    private readonly technologiesByExperience: TechnologiesByExperienceLoader,
  ) {}

  @ResolveField(() => Boolean, {
    description: 'Whether the position is held now',
  })
  isCurrent(@Parent() position: Experience): boolean {
    return this.experience.isCurrent(position);
  }

  @ResolveField(() => [Skill], {
    description: 'Technologies used in the role',
  })
  technologies(
    @Parent() position: Experience,
    @Loaders() loaders: LoaderRegistry,
  ): Promise<Skill[]> {
    return loaders.get(this.technologiesByExperience).load(position.id);
  }
}
