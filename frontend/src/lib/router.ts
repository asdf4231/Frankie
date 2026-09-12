/**
 * Query-string router. All navigation state lives in the URL and every view reads it
 * through `useRoute()`; nothing else touches `history` or `location`.
 *
 *   ?view=chat[&session=<id>]
 *   ?view=wiki[&file=<abs_path>]
 *   ?view=lectures[&file=<abs_path>]
 *   ?view=learning | status | settings
 */

import { useSyncExternalStore } from 'react'

export type View = 'chat' | 'wiki' | 'lectures' | 'learning' | 'status' | 'settings'

export interface Route {
  view: View
  session?: string
  file?: string
}

const VIEWS: readonly View[] = ['chat', 'wiki', 'lectures', 'learning', 'status', 'settings']

const listeners = new Set<() => void>()
let cachedSearch: string | null = null
let cachedRoute: Route = { view: 'chat' }

function parse(search: string): Route {
  const params = new URLSearchParams(search)
  const view = params.get('view')
  return {
    view: (VIEWS as readonly string[]).includes(view ?? '') ? (view as View) : 'chat',
    session: params.get('session') ?? undefined,
    file: params.get('file') ?? undefined,
  }
}

/** Same object while the URL is unchanged, as useSyncExternalStore requires. */
function snapshot(): Route {
  if (window.location.search !== cachedSearch) {
    cachedSearch = window.location.search
    cachedRoute = parse(cachedSearch)
  }
  return cachedRoute
}

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

window.addEventListener('popstate', emit)

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, snapshot)
}

export function getRoute(): Route {
  return snapshot()
}

export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const params = new URLSearchParams()
  params.set('view', route.view)
  if (route.session) params.set('session', route.session)
  if (route.file) params.set('file', route.file)
  const search = `?${params.toString()}`
  if (search === window.location.search) return
  history[options.replace ? 'replaceState' : 'pushState'](null, '', search)
  emit()
}

/** Lecture Markdown lives under `raw/` inside the wiki root; everything else is a Wiki page. */
export const viewForRelPath = (relPath: string): View => (relPath.startsWith('raw/') ? 'lectures' : 'wiki')
