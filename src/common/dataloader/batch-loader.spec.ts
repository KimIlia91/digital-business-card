import { MAX_BATCH_SIZE, OneToManyLoader } from './batch-loader.js';
import { LoaderRegistry } from './loader-registry.js';

/** Children of key `k` are `['k-a', 'k-b']`; keys listed in `missing` have none. */
class FakeChildrenLoader extends OneToManyLoader<number, string> {
  readonly batches: number[][] = [];
  failNextBatch = false;

  constructor(private readonly missing: ReadonlySet<number> = new Set()) {
    super();
  }

  protected loadBatch(keys: readonly number[]): Promise<Map<number, string[]>> {
    this.batches.push([...keys]);
    if (this.failNextBatch) {
      this.failNextBatch = false;
      return Promise.reject(new Error('database is down'));
    }
    const found = keys
      .filter((key) => !this.missing.has(key))
      .map((key): [number, string[]] => [key, [`${key}-a`, `${key}-b`]]);
    return Promise.resolve(new Map(found));
  }
}

describe('OneToManyLoader', () => {
  it('batches loads issued in the same tick into one call, in key order', async () => {
    const definition = new FakeChildrenLoader();
    const loader = definition.create();

    const results = await Promise.all([loader.load(2), loader.load(1)]);

    expect(definition.batches).toEqual([[2, 1]]);
    expect(results).toEqual([
      ['2-a', '2-b'],
      ['1-a', '1-b'],
    ]);
  });

  it('serves repeated keys from the per-request cache', async () => {
    const definition = new FakeChildrenLoader();
    const loader = definition.create();

    await Promise.all([loader.load(1), loader.load(1)]);
    await loader.load(1);

    expect(definition.batches).toEqual([[1]]);
  });

  it('resolves keys without data to an empty list next to keys with data', async () => {
    const loader = new FakeChildrenLoader(new Set([42])).create();

    const [found, missing] = await Promise.all([
      loader.load(1),
      loader.load(42),
    ]);

    expect(found).toEqual(['1-a', '1-b']);
    expect(missing).toEqual([]);
  });

  it('rejects every key of a failed batch without poisoning later batches', async () => {
    const definition = new FakeChildrenLoader();
    definition.failNextBatch = true;
    const loader = definition.create();

    const failed = await Promise.allSettled([loader.load(1), loader.load(2)]);
    expect(failed.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
    ]);

    await expect(loader.load(1)).resolves.toEqual(['1-a', '1-b']);
  });

  it('splits very large batches', async () => {
    const definition = new FakeChildrenLoader();
    const loader = definition.create();
    const keys = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => i);

    await loader.loadMany(keys);

    expect(definition.batches.map((batch) => batch.length)).toEqual([
      MAX_BATCH_SIZE,
      1,
    ]);
  });
});

describe('LoaderRegistry', () => {
  it('reuses one DataLoader per definition within a request', () => {
    const definition = new FakeChildrenLoader();
    const registry = new LoaderRegistry();

    expect(registry.get(definition)).toBe(registry.get(definition));
  });

  it('never shares DataLoaders (and their caches) between requests', () => {
    const definition = new FakeChildrenLoader();

    expect(new LoaderRegistry().get(definition)).not.toBe(
      new LoaderRegistry().get(definition),
    );
  });
});
