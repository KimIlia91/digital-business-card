import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { ProfileRepository } from './profile.repository.js';
import { ProfileService } from './profile.service.js';

describe('ProfileService', () => {
  let service: ProfileService;
  const repository = {
    findBySlug: vi.fn(),
    findOwner: vi.fn(),
    findLinksByProfileIds: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: ProfileRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(ProfileService);
  });

  it.each([undefined, null, '', '   '])(
    'returns the card owner when the slug is %j',
    async (slug) => {
      await service.findBySlug(slug);

      expect(repository.findOwner).toHaveBeenCalledOnce();
      expect(repository.findBySlug).not.toHaveBeenCalled();
    },
  );

  it('looks up a normalized slug', async () => {
    await service.findBySlug('  Jane-Doe ');

    expect(repository.findBySlug).toHaveBeenCalledWith('jane-doe');
    expect(repository.findOwner).not.toHaveBeenCalled();
  });

  it('groups links by profile, keeping the repository order', async () => {
    repository.findLinksByProfileIds.mockResolvedValue([
      { id: 1, profileId: 7 },
      { id: 2, profileId: 8 },
      { id: 3, profileId: 7 },
    ]);

    const grouped = await service.findLinksByProfileIds([7, 8]);

    expect(grouped.get(7)?.map((link) => link.id)).toEqual([1, 3]);
    expect(grouped.get(8)?.map((link) => link.id)).toEqual([2]);
  });
});
