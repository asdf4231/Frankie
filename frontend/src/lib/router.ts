/**
 * Query-string router. Navigation targets live in the URL; history entries have identities
 * for reader scroll restoration. Views use `useRoute()`; only this module touches browser history.
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
let cachedRoute: Route & { entryKey: string } = { view: 'chat', entryKey: '' }

const newEntryKey = () => crypto.getRandomValues(new Uint32Array(4)).join('-')

function historyEntryKey(): string {
  if (!history.state?.frankieEntryKey) {
    history.replaceState({ ...history.state, frankieEntryKey: newEntryKey() }, '')
  }
  return history.state.frankieEntryKey
}

let entryKey = historyEntryKey()

function parse(search: string): Route {
  const params = new URLSearchParams(search)
  const view = params.get('view')
  return {
    view: (VIEWS as readonly string[]).includes(view ?? '') ? (view as View) : 'chat',
    session: params.get('session') ?? undefined,
    file: params.get('file') ?? undefined,
  }
}

/** Same object while the URL and history entry are unchanged, as useSyncExternalStore requires. */
function snapshot() {
  if (window.location.search !== cachedSearch || entryKey !== cachedRoute.entryKey) {
    cachedSearch = window.location.search
    cachedRoute = { ...parse(cachedSearch), entryKey }
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

window.addEventListener('popstate', () => {
  entryKey = historyEntryKey()
  emit()
})

export function useRoute() {
  return useSyncExternalStore(subscribe, snapshot)
}

export function getRoute() {
  return snapshot()
}

export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const params = new URLSearchParams()
  params.set('view', route.view)
  if (route.session) params.set('session', route.session)
  if (route.file) params.set('file', route.file)
  const search = `?${params.toString()}`
  if (search === window.location.search) return
  const state = { ...(options.replace ? history.state : {}), frankieEntryKey: newEntryKey() }
  history[options.replace ? 'replaceState' : 'pushState'](state, '', search)
  entryKey = state.frankieEntryKey
  emit()
}

/** Lecture Markdown lives under `raw/` inside the wiki root; everything else is a Wiki page. */
export const viewForRelPath = (relPath: string): View => (relPath.startsWith('raw/') ? 'lectures' : 'wiki')
