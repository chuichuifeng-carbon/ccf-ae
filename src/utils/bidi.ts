/** Isolate Latin model codes, technical terms, phones and URLs in trusted editorial HTML.
 * Markup/attributes are preserved; never use this as an HTML sanitizer.
 */
export function isolateLatin(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/(<[^>]*>)/g)
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(
        /(?:\+\d[\d ()-]*\d|[A-Za-z0-9]+(?:[ ./@&+()_-]+[A-Za-z0-9]+)*)/g,
        (match) => `<bdi dir="ltr">${match}</bdi>`
      );
    })
    .join('');
}
