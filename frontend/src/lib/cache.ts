/**
 * Module-scope cache for the course lists. They change only when the teacher pushes to
 * the course repository, so views can remount freely without refetching.
 */

import { getSources, getWiki } from '../api/client'

const STALE_MS = 5 * 60_000

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

export const getWikiCached = () => wiki.get()
export const getSourcesCached = () => sources.get()
export function invalidateLibrary() {
  wiki.invalidate()
  sources.invalidate()
}
