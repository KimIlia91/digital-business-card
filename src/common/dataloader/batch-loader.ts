import DataLoader from 'dataloader';

export const MAX_BATCH_SIZE = 1000;

/**
 * Subclasses are singleton providers; the `DataLoader` instances they create
 * are per request (see {@link LoaderRegistry}), so no provider has to be
 * request-scoped.
 */
export abstract class BatchLoader<K, V> {
  /** Keys missing from the returned map resolve to {@link fallback}. */
  protected abstract loadBatch(keys: readonly K[]): Promise<Map<K, V>>;

  protected abstract fallback(key: K): V;

  create(): DataLoader<K, V> {
    return new DataLoader<K, V>(
      async (keys) => {
        const found = await this.loadBatch(keys);
        return keys.map((key) => found.get(key) ?? this.fallback(key));
      },
      { maxBatchSize: MAX_BATCH_SIZE },
    );
  }
}

export abstract class OneToManyLoader<K, V> extends BatchLoader<K, V[]> {
  protected fallback(): V[] {
    return [];
  }
}
