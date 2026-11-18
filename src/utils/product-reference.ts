/** A stable reference assigned by this website; not a factory SKU. */
export function productReference(slug: string): string {
  let hash = 2166136261;
  for (const char of slug) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `CCF-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}
