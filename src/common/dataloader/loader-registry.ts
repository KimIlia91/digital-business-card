import type DataLoader from 'dataloader';
import type { BatchLoader } from './batch-loader.js';

/** One registry per GraphQL request, so batching and caching never leak between requests. */
export class LoaderRegistry {
  private readonly loaders = new Map<
    BatchLoader<unknown, unknown>,
    DataLoader<unknown, unknown>
  >();

  get<K, V>(definition: BatchLoader<K, V>): DataLoader<K, V> {
    let loader = this.loaders.get(definition);
    if (!loader) {
      loader = definition.create();
      this.loaders.set(definition, loader);
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- entries are keyed by their own definition, so the stored loader has exactly that definition's key and value types
    return loader as DataLoader<K, V>;
  }
}
