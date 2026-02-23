/**
 * Shared mongoose utilities used across services.
 * - resolveQuery: normalizes handling of mongoose Query-like values in runtime and tests
 * - escapeRegex: escape user input for safe RegExp usage
 */

export async function resolveQuery<T = any>(q: any): Promise<T> {
  if (!q) return q as T;
  try {
    if (typeof q.lean === 'function') {
      return await q.lean().exec();
    }
    if (typeof q.exec === 'function') {
      return await q.exec();
    }
    if (typeof q.then === 'function') {
      return await q;
    }
    return q as T;
  } catch (err) {
    throw err;
  }
}

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

