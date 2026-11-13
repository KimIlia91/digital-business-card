import { vi } from 'vitest';
import type { ProjectEntity, SkillEntity } from '../../prisma/entities.js';
import type { ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';

const skill = (id: number): SkillEntity => ({
  id,
  profileId: 1,
  name: `Skill ${id}`,
  category: 'BACKEND',
  sortOrder: id,
});

const project = (
  overrides: Partial<ProjectEntity> & Pick<ProjectEntity, 'id'>,
): ProjectEntity => ({
  profileId: 1,
  name: `Project ${overrides.id}`,
  description: null,
  url: null,
  repositoryUrl: null,
  sortOrder: 0,
  ...overrides,
});

describe('ProjectsService', () => {
  const repository = {
    findByProfileIds: vi.fn<ProjectsRepository['findByProfileIds']>(),
    findTechnologies: vi.fn<ProjectsRepository['findTechnologies']>(),
  };
  const service = new ProjectsService(
    repository as unknown as ProjectsRepository,
  );

  it('groups projects by profile, keeping the repository order', async () => {
    repository.findByProfileIds.mockResolvedValue([
      project({ id: 3, profileId: 2 }),
      project({ id: 1, profileId: 1 }),
      project({ id: 2, profileId: 2 }),
    ]);

    const grouped = await service.findByProfileIds([1, 2]);

    expect(grouped.get(1)?.map((p) => p.id)).toEqual([1]);
    expect(grouped.get(2)?.map((p) => p.id)).toEqual([3, 2]);
    expect(repository.findByProfileIds).toHaveBeenCalledWith([1, 2]);
  });

  it('maps technologies to their own project', async () => {
    repository.findTechnologies.mockResolvedValue([
      { id: 10, technologies: [skill(1), skill(2)] },
      { id: 20, technologies: [] },
    ]);

    const technologies = await service.findTechnologiesByProjectIds([10, 20]);

    expect(technologies.get(10)?.map((s) => s.id)).toEqual([1, 2]);
    expect(technologies.get(20)).toEqual([]);
    expect(repository.findTechnologies).toHaveBeenCalledWith([10, 20]);
  });
});
