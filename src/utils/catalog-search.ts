/** Normalize Russian buyer queries without changing stored product facts. */
export function normalizeCatalogSearch(value: string): string {
  return value
    .toLocaleLowerCase('ru-RU')
    .normalize('NFKC')
    .replace(/ё/g, 'е')
    .replace(/[‐‑–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesCatalogSearch(haystack: string, query: string): boolean {
  const aliases: Record<string, string> = {
    зеркала: 'зеркал',
    зеркальца: 'зеркал',
    решетки: 'решет',
    решетка: 'решет',
    диффузоры: 'диффузор',
    капоты: 'капот',
    сплиттеры: 'сплиттер',
    порог: 'порог',
    пороги: 'порог',
  };
  const source = normalizeCatalogSearch(haystack);
  const normalizedQuery = normalizeCatalogSearch(query);
  if (normalizedQuery.includes('без acc') && !source.includes('без acc')) return false;
  if (/(^|\s)с acc(\s|$)/.test(normalizedQuery) && !/(^|\s)с acc(\s|$)/.test(source)) return false;
  return normalizeCatalogSearch(query)
    .split(' ')
    .filter(Boolean)
    .every((term) => source.includes(aliases[term] || term));
}
