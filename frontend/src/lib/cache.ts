/**
 * Module-scope cache for course lists, documents and resolved references. They change when the teacher pushes to
 * the course repository, so views can remount freely without refetching.
 */

import { getFile, getSources, getWiki, resolveWiki } from '../api/client'

const STALE_MS = 5 * 60_000
const DOCUMENT_LIMIT = 10
const documents = new Map<string, string>()

function cached<T>(load: () => Promise<T>) {
  let entry: { at: number; promise: Promise<T> } | null = null
  return {
    get(): Promise<T> {
      if (!entry || Date.now() - entry.at > STALE_MS) {
        const current = { at: Date.now(), promise: load() }
        entry = current
        current.promise.catch(() => {
          if (entry === current) entry = null
        })
        return current.promise
      }
      return entry.promise
    },
    invalidate() {
      entry = null
    },
  }
}

const wiki = cached(getWiki)
const sources = cached(getSources)
const references = new Map<string, { get(): ReturnType<typeof resolveWiki> }>()

export function resolveReferenceCached(target: string, source?: string) {
  const key = JSON.stringify([target, source])
  let entry = references.get(key)
  if (!entry) {
    entry = cached(() => resolveWiki(target, source))
    references.set(key, entry)
  }
  return entry.get()
}

/** The reader owns cancellation; only completed documents enter the ten-document LRU cache. */
export async function getDocumentCached(path: string, signal: AbortSignal): Promise<string> {
  // Let synchronous route changes and StrictMode cleanup cancel before starting network work.
  await Promise.resolve()
  signal.throwIfAborted()
  const hit = documents.get(path)
  if (hit !== undefined) {
    documents.delete(path)
    documents.set(path, hit)
    return hit
  }
  const { content } = await getFile(path, signal)
  signal.throwIfAborted()
  documents.set(path, content)
  if (documents.size > DOCUMENT_LIMIT) documents.delete(documents.keys().next().value!)
  return content
}

export const getWikiCached = () => wiki.get()
export const getSourcesCached = () => sources.get()
export function invalidateLibrary() {
  wiki.invalidate()
  sources.invalidate()
  references.clear()
  documents.clear()
}
