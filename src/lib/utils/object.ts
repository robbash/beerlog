export type Json = Record<string, unknown>;

export function shallowDiff(before: Json, after: Json, skipProps: string[] = []) {
  const b = before ?? {};
  const a = after ?? {};

  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  for (const k of keys) {
    if (skipProps.includes(k)) {
      continue;
    }

    const bv = (b as Record<string, unknown>)[k];
    const av = (a as Record<string, unknown>)[k];

    const changed =
      bv === null || av === null ? bv !== av : JSON.stringify(bv) !== JSON.stringify(av);

    if (changed) {
      diff[k] = { before: bv, after: av };
    }
  }

  return diff;
}
