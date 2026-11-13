import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { LoaderRegistry } from '../../common/dataloader/loader-registry.js';
import { Loaders } from '../../common/graphql/loaders.decorator.js';
import { Skill } from '../skills/models/skill.model.js';
import { Project } from './models/project.model.js';
import { TechnologiesByProjectLoader } from './projects.loaders.js';

@Resolver(() => Project)
export class ProjectsResolver {
  constructor(
    private readonly technologiesByProject: TechnologiesByProjectLoader,
  ) {}

  @ResolveField(() => [Skill], {
    description: 'Technologies the project is built with',
  })
  technologies(
    @Parent() project: Project,
    @Loaders() loaders: LoaderRegistry,
  ): Promise<Skill[]> {
    return loaders.get(this.technologiesByProject).load(project.id);
  }
}
