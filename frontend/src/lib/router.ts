/** Query-string router with typed, view-specific state and stable history-entry identities. */

import { useSyncExternalStore, type MouseEvent as ReactMouseEvent } from 'react'
import { SAVE_CHAT_POSITION_EVENT } from './chatPosition'

export type View = 'chat' | 'wiki' | 'lectures' | 'learning' | 'status' | 'settings'
export type LearningSection = 'students' | 'summaries'

export interface Route {
  view: View
  session?: string
  file?: string
  /** Canonical document heading anchor supplied by the backend. */
  anchor?: string
  /** An unresolved internal document target. It is canonicalized through /api/wiki/resolve after navigation. */
  ref?: string
  source?: string
  sidebarSearch?: string
  librarySearch?: string
  /** The user explicitly navigated from a document back to the library file list. */
  libraryList?: boolean
  learningSection?: LearningSection
  studentSearch?: string
  student?: string
  learningSession?: string
  learningPane?: 'sessions' | 'record'
  summary?: string
  /** The analytics report form is open instead of a saved report. */
  compose?: boolean
  offset?: number
  showAnswers?: boolean
}

const VIEWS: readonly View[] = ['chat', 'wiki', 'lectures', 'learning', 'status', 'settings']
const listeners = new Set<() => void>()
let cachedSearch: string | null = null
let cachedRoute: Route & { entryKey: string } = { view: 'chat', entryKey: '' }
const newEntryKey = () => crypto.getRandomValues(new Uint32Array(4)).join('-')

function historyEntryKey(): string {
  if (!history.state?.frankieEntryKey) history.replaceState({ ...history.state, frankieEntryKey: newEntryKey() }, '')
  return history.state.frankieEntryKey as string
}

// Reading panes restore their own positions; browser traversal must not override them.
history.scrollRestoration = 'manual'
let entryKey = historyEntryKey()
const text = (params: URLSearchParams, key: string) => params.get(key) || undefined

function parse(search: string): Route {
   const params = new URLSearchParams(search)
  const candidate = params.get('view')
  const offset = Number.parseInt(params.get('offset') ?? '', 10)
  return {
    view: (VIEWS as readonly string[]).includes(candidate ?? '') ? candidate as View : 'chat',
    session: text(params, 'session'),
    file: text(params, 'file'),
    anchor: text(params, 'anchor'),
    ref: text(params, 'ref'),
    source: text(params, 'source'),
    sidebarSearch: text(params, 'historySearch'),
    librarySearch: text(params, 'search'),
    libraryList: params.get('list') === '1' ? true : undefined,
    learningSection: params.get('section') === 'students' ? 'students' : undefined,
    studentSearch: text(params, 'studentSearch'),
    student: text(params, 'student'),
    learningSession: text(params, 'record'),
    learningPane: params.get('pane') === 'sessions' ? 'sessions' : params.get('pane') === 'record' ? 'record' : undefined,
    summary: text(params, 'summary'),
    compose: params.get('compose') === '1' ? true : undefined,
    offset: Number.isFinite(offset) && offset > 0 ? offset : undefined,
    showAnswers: params.get('answers') === '0' ? false : undefined,
  }
}

function snapshot() {
  if (window.location.search !== cachedSearch || entryKey !== cachedRoute.entryKey) {
    cachedSearch = window.location.search
    cachedRoute = { ...parse(cachedSearch), entryKey }
  }
  return cachedRoute
}

const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

window.addEventListener('popstate', () => {
  window.dispatchEvent(new Event(SAVE_CHAT_POSITION_EVENT))
  entryKey = historyEntryKey()
  emit()
})

export function useRoute() { return useSyncExternalStore(subscribe, snapshot) }
export function getRoute() { return snapshot() }

export function routeHref(route: Route): string {
  const params = new URLSearchParams()
  params.set('view', route.view)
  const set = (key: string, value: string | undefined) => { if (value) params.set(key, value) }
  set('session', route.session)
  set('file', route.file)
  set('anchor', route.anchor)
  set('ref', route.ref)
  set('source', route.source)
  set('historySearch', route.sidebarSearch)
  set('search', route.librarySearch)
  if (route.libraryList) params.set('list', '1')
  if (route.learningSection === 'students') params.set('section', 'students')
  set('studentSearch', route.studentSearch)
  set('student', route.student)
  set('record', route.learningSession)
  set('pane', route.learningPane)
  set('summary', route.summary)
  if (route.compose) params.set('compose', '1')
  if (route.offset && route.offset > 0) params.set('offset', String(route.offset))
  if (route.showAnswers === false) params.set('answers', '0')
  return `?${params.toString()}`
}

export function isUnmodifiedPrimaryClick(event: Pick<ReactMouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/** Use on internal anchors. Modified and middle clicks retain the browser's native behavior. */
type NavigationOptions = { replace?: boolean; intent?: 'document'; fromFile?: string }

export function followRoute(event: ReactMouseEvent, route: Route, options: NavigationOptions = {}) {
  if (!isUnmodifiedPrimaryClick(event)) return
  event.preventDefault()
  navigate(route, options)
}

export const ANCHOR_NAVIGATION_EVENT = 'frankie:anchor-navigation'

export function navigate(route: Route, options: NavigationOptions = {}) {
  const search = routeHref(route)
  if (search === window.location.search) {
    if (route.anchor) window.dispatchEvent(new CustomEvent(ANCHOR_NAVIGATION_EVENT, { detail: route.anchor }))
    return
  }
  window.dispatchEvent(new Event(SAVE_CHAT_POSITION_EVENT))
  const nextEntryKey = options.replace ? entryKey : newEntryKey()
  const state = { ...(options.replace ? history.state : {}), frankieEntryKey: nextEntryKey, ...(options.intent ? { frankieNavigationIntent: options.intent, frankieNavigationFromFile: options.fromFile } : {}) }
  history[options.replace ? 'replaceState' : 'pushState'](state, '', search)
  entryKey = nextEntryKey
  emit()
}

export function consumeNavigationIntent(expectedEntryKey: string, intent: 'document'): { fromFile?: string } | null {
  if (expectedEntryKey !== entryKey || history.state?.frankieNavigationIntent !== intent) return null
  const fromFile = typeof history.state.frankieNavigationFromFile === 'string' ? history.state.frankieNavigationFromFile : undefined
  const state = { ...history.state }
  delete state.frankieNavigationIntent
  delete state.frankieNavigationFromFile
  history.replaceState(state, '', window.location.href)
  return { fromFile }
}

export const viewForRelPath = (relPath: string): View => relPath.startsWith('raw/') ? 'lectures' : 'wiki'

export function pendingReferenceRoute(target: string, source?: string): Route {
  return { view: 'wiki', ref: target, source }
}
