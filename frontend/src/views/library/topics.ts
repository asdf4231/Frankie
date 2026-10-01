/** Display directory slugs as titles without changing their paths. */
export function topicTitle(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

/** Authored index.md order, with unlisted topics or pages last alphabetically. */
export function compareIndexOrder(
  a: { title: string; indexOrder?: number },
  b: { title: string; indexOrder?: number },
): number {
  return (a.indexOrder ?? Infinity) - (b.indexOrder ?? Infinity) || a.title.localeCompare(b.title)
}
