/** Display directory slugs as titles without changing their paths. */
export function topicTitle(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

/** The course-source header identifies a page's lectures, rather than incidental mentions in its body. */
export function firstLecture(text: string): number | undefined {
  const sources = text.match(/^>[\t ]*course sources?:[\t ]*(.*)$/im)?.[1] ?? ''
  const lectures = Array.from(sources.matchAll(/\braw\/lectures\/lecture-(\d+)\.md\b/gi), (match) => Number(match[1]))
  return lectures.length ? Math.min(...lectures) : undefined
}
