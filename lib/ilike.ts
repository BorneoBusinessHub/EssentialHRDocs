// Make user text safe inside a PostgREST .or('col.ilike.%…%,tags.cs.{…}') filter.
// Backslash-escape LIKE wildcards; replace characters that break the or() grammar or the {} array literal.
export function escapeIlike(q: string): string {
  return q.replace(/[\%_]/g, '\$&').replace(/[,()"{}]/g, ' ').trim();
}
