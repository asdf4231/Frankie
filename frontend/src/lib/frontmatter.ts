import { parse } from 'yaml'

export interface DocumentContent {
  meta: { title?: string; date?: string; tags: string[] }
  body: string
}

const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : undefined

/** Read the leading YAML block; Markdown stays separate from document metadata. */
export function splitFrontmatter(source: string): DocumentContent {
  const src = source.replace(/^\uFEFF/, '')
  const start = src.match(/^---[\t ]*\r?\n/)
  if (!start) return { meta: { tags: [] }, body: src }
  const rest = src.slice(start[0].length)
  const end = rest.match(/^(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/m)
  if (!end) return { meta: { tags: [] }, body: src }
  const parsed: unknown = parse(rest.slice(0, end.index))
  const meta = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  const tags = Array.isArray(meta.tags) ? meta.tags : meta.tags == null ? [] : [meta.tags]
  return {
    meta: {
      title: text(meta.title),
      date: meta.date instanceof Date ? meta.date.toISOString().slice(0, 10) : text(meta.date),
      tags: [...new Set(tags.map(text).filter((tag): tag is string => !!tag))],
    },
    body: rest.slice(end.index! + end[0].length),
  }
}
