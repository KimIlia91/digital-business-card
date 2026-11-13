import { vi } from 'vitest';
import type { ExperienceEntity } from '../../prisma/entities.js';
import type { ExperienceRepository } from './experience.repository.js';
import { ExperienceService } from './experience.service.js';

const position = (
  overrides: Partial<ExperienceEntity> & Pick<ExperienceEntity, 'id'>,
): ExperienceEntity => ({
  profileId: 1,
  company: 'Acme',
  position: 'Developer',
  location: null,
  startDate: new Date('2020-01-01T00:00:00.000Z'),
  endDate: null,
  summary: null,
  achievements: [],
  ...overrides,
});

describe('ExperienceService', () => {
  const repository = {
    findByProfileIds: vi.fn<ExperienceRepository['findByProfileIds']>(),
    findTechnologies: vi.fn<ExperienceRepository['findTechnologies']>(),
  };
  const service = new ExperienceService(
    repository as unknown as ExperienceRepository,
  );

  describe('isCurrent', () => {
    const today = new Date('2026-11-13T15:30:00.000Z');

    it('is true for a position without an end date', () => {
      expect(service.isCurrent({ endDate: null }, today)).toBe(true);
    });

    it('is true until the end date (inclusive)', () => {
      const endDate = new Date('2026-11-13T00:00:00.000Z');
      expect(service.isCurrent({ endDate }, today)).toBe(true);
    });

    it('is false after the end date', () => {
      const endDate = new Date('2026-11-12T00:00:00.000Z');
      expect(service.isCurrent({ endDate }, today)).toBe(false);
    });
  });

  it('groups positions by profile, keeping the repository order', async () => {
    repository.findByProfileIds.mockResolvedValue([
      position({ id: 3, profileId: 2 }),
      position({ id: 1, profileId: 1 }),
      position({ id: 2, profileId: 2 }),
    ]);

    const grouped = await service.findByProfileIds([1, 2]);

    expect(grouped.get(1)?.map((p) => p.id)).toEqual([1]);
    expect(grouped.get(2)?.map((p) => p.id)).toEqual([3, 2]);
    expect(repository.findByProfileIds).toHaveBeenCalledWith([1, 2]);
  });
});
