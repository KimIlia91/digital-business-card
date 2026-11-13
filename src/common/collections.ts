/** Preserves item order: repositories return rows already sorted. */
export function groupBy<K, V>(
  items: Iterable<V>,
  keyOf: (item: V) => K,
): Map<K, V[]> {
  const groups = new Map<K, V[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
