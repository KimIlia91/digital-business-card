import { vi } from 'vitest';
import type { SkillEntity } from '../../prisma/entities.js';
import type { SkillsRepository } from './skills.repository.js';
import { SkillsService } from './skills.service.js';

const skill = (
  id: number,
  profileId: number,
  category: SkillEntity['category'],
): SkillEntity => ({
  id,
  profileId,
  name: `Skill ${id}`,
  category,
  sortOrder: id,
});

describe('SkillsService', () => {
  const repository = {
    findByProfileIds: vi.fn<SkillsRepository['findByProfileIds']>(),
  };
  const service = new SkillsService(repository as unknown as SkillsRepository);

  it('groups skills by profile, keeping the repository order', async () => {
    repository.findByProfileIds.mockResolvedValue([
      skill(1, 1, 'LANGUAGE'),
      skill(2, 2, 'DATABASE'),
      skill(3, 1, 'DATABASE'),
    ]);

    const grouped = await service.findByProfileIds([1, 2]);

    expect(grouped.get(1)?.map((s) => s.id)).toEqual([1, 3]);
    expect(grouped.get(2)?.map((s) => s.id)).toEqual([2]);
  });

  describe('filterByCategory', () => {
    const skills = [
      skill(1, 1, 'LANGUAGE'),
      skill(2, 1, 'DATABASE'),
      skill(3, 1, 'LANGUAGE'),
    ];

    it('keeps only the requested category, in order', () => {
      expect(
        service.filterByCategory(skills, 'LANGUAGE').map((s) => s.id),
      ).toEqual([1, 3]);
    });

    it.each([undefined, null])('returns every skill for %j', (category) => {
      expect(service.filterByCategory(skills, category)).toEqual(skills);
    });

    it('returns a copy, never the cached list itself', () => {
      expect(service.filterByCategory(skills)).not.toBe(skills);
    });
  });
});
