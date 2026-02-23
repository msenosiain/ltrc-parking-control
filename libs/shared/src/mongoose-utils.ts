/**
 * Shared mongoose utilities used across services.
 * - resolveQuery: normalizes handling of mongoose Query-like values in runtime and tests
 * - escapeRegex: escape user input for safe RegExp usage
 */

export async function resolveQuery<T = any>(q: unknown): Promise<T> {
  if (!q) return q as T;

  // Handle common mongoose query-like shapes: query.lean().exec(), query.exec(), thenable
  if (typeof (q as any).lean === 'function') {
    return await (q as any).lean().exec();
  }
  if (typeof (q as any).exec === 'function') {
    return await (q as any).exec();
  }
  if (typeof (q as any).then === 'function') {
    return await (q as any);
  }
  return q as T;
}

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
