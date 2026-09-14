/**
 * Module-scope cache for course lists, documents and resolved references. They change when the teacher pushes to
 * the course repository, so views can remount freely without refetching.
 */

import { getFile, getSources, getWiki, resolveWiki, type CourseDocument } from '../api/client'

const STALE_MS = 5 * 60_000
const DOCUMENT_LIMIT = 10
const documents = new Map<string, CourseDocument>()

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
export type ResolvedReference = Awaited<ReturnType<typeof resolveWiki>>
const references = new Map<string, { get(): ReturnType<typeof resolveWiki> }>()
const resolvedReferences = new Map<string, ResolvedReference>()
const referenceKey = (target: string, source?: string) => JSON.stringify([target, source])

export function resolveReferenceCached(target: string, source?: string) {
  const key = referenceKey(target, source)
  let entry = references.get(key)
  if (!entry) {
    entry = cached(() => resolveWiki(target, source).then((page) => {
      resolvedReferences.set(key, page)
      return page
    }))
    references.set(key, entry)
  }
  return entry.get()
}

/** Synchronous metadata lookup only; rendering links never starts a request. Hover/focus and navigation may populate it. */
export function getResolvedReference(target: string, source?: string) {
  return resolvedReferences.get(referenceKey(target, source))
}

/** The reader owns cancellation; only completed documents enter the ten-document LRU cache. */
export async function getDocumentCached(path: string, signal: AbortSignal): Promise<CourseDocument> {
  // Let synchronous route changes and StrictMode cleanup cancel before starting network work.
  await Promise.resolve()
  signal.throwIfAborted()
  const hit = documents.get(path)
  if (hit !== undefined) {
    documents.delete(path)
    documents.set(path, hit)
    return hit
  }
  const document = await getFile(path, signal)
  signal.throwIfAborted()
  documents.set(path, document)
  if (documents.size > DOCUMENT_LIMIT) documents.delete(documents.keys().next().value!)
  return document
}

export const getWikiCached = () => wiki.get()
export const getSourcesCached = () => sources.get()
export function invalidateLibrary() {
  wiki.invalidate()
  sources.invalidate()
  references.clear()
  resolvedReferences.clear()
  documents.clear()
}
