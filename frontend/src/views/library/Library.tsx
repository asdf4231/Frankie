import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../../api/client'
import { getSourcesCached, getWikiCached, invalidateLibrary } from '../../lib/cache'
import { navigate, useRoute } from '../../lib/router'
import FileList, { type LibraryFile, type LibraryKind } from './FileList'
import Reader from './Reader'
import { firstLecture } from './topics'
import './library.css'

interface ListState {
  kind: LibraryKind
  files: LibraryFile[]
  error?: string
}
const EMPTY_FILES: LibraryFile[] = []
const PANEL_FOCUSABLE = 'button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled), [tabindex="0"]'
const basename = (path: string) => path.replace(/\\/g, '/').split('/').pop() || path

interface Props {
  kind: LibraryKind
  navigation?: ReactNode
  isMobile: boolean
  panelOpen: boolean
  onPanelClose: () => void
  pendingReference: boolean
  referenceError?: string
  onReferenceRetry: () => void
}

export default function Library({ kind, navigation, isMobile, panelOpen, onPanelClose, pendingReference, referenceError, onReferenceRetry }: Props) {
  const route = useRoute()
  const { file: path, entryKey } = route
  const [list, setList] = useState<ListState | null>(null)
  const [revision, setRevision] = useState(0)
  const previousPath = useRef<string | undefined>(path)
  const panelRef = useRef<HTMLElement>(null)
  const readerScrollRef = useRef<HTMLDivElement>(null)
  const focusReader = useCallback((preferred?: HTMLElement | null) => {
    const fallback = readerScrollRef.current
    const target = preferred?.isConnected && !preferred.closest('[inert], [aria-hidden="true"]') && preferred.getClientRects().length
      ? preferred
      : fallback && !fallback.closest('[inert], [aria-hidden="true"]') && fallback.getClientRects().length ? fallback : null
    target?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    let active = true
    const request = kind === 'wiki'
      ? getWikiCached().then(({ files }) => files.map((file) => ({
        path: file.abs_path,
        relativePath: file.rel_path.replace(/\\/g, '/'),
        title: file.title || basename(file.rel_path),
        firstLecture: firstLecture(file.search_text ?? ''),
        searchText: [file.title, file.rel_path, file.search_text].filter(Boolean).join('\n').toLowerCase(),
      })))
      : getSourcesCached().then(({ files }) => files.map((file) => ({
        path: file.abs_path,
        relativePath: file.path.replace(/\\/g, '/'),
        title: file.title || basename(file.path),
        searchText: [file.title, file.path, file.search_text].filter(Boolean).join('\n').toLowerCase(),
      })))
    request
      .then((files) => { if (active) setList({ kind, files }) })
      .catch((error: unknown) => {
        if (active) setList({ kind, files: [], error: errorMessage(error, 'The file list could not be loaded. Check your connection and try again.') })
      })
    return () => { active = false }
  }, [kind, revision])

  useLayoutEffect(() => {
    const previous = previousPath.current
    if (!path && !pendingReference && previous) {
      const target = document.querySelector<HTMLAnchorElement>(`[data-library-path="${CSS.escape(previous)}"]`)
        ?? document.querySelector<HTMLInputElement>(`[name="${kind}-search"]`)
      target?.focus({ preventScroll: true })
    }
    previousPath.current = path
  }, [path, kind, pendingReference])

  useLayoutEffect(() => {
    if (!panelOpen) return
    const panel = panelRef.current
    if (!panel) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onPanelClose()
      } else if (event.key === 'Tab') {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(PANEL_FOCUSABLE))
          .filter((item) => item.getClientRects().length > 0)
        if (!items.length) return
        const active = document.activeElement as HTMLElement
        const outside = !items.includes(active)
        const target = event.shiftKey
          ? outside || active === items[0] ? items.at(-1) : undefined
          : outside || active === items.at(-1) ? items[0] : undefined
        if (target) {
          event.preventDefault()
          target.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    panel.querySelector<HTMLButtonElement>('[data-library-panel-close]')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      focusReader(opener)
    }
  }, [focusReader, panelOpen, onPanelClose])

  const current = list?.kind === kind ? list : null
  const files = current?.files ?? EMPTY_FILES
  const selected = files.find((file) => file.path === path)

  // Land on a default document (the Wiki index, the first lecture) instead of an empty reader.
  useLayoutEffect(() => {
    if (path || pendingReference || !current || !files.length) return
    const target = kind === 'wiki' ? files.find((file) => file.relativePath === 'index.md') ?? files[0] : files[0]
    navigate({ ...route, view: kind, file: target.path }, { replace: true })
  }, [kind, path, pendingReference, current, files, route])
  const hasDocument = !!path || pendingReference
  const drawer = isMobile && hasDocument
  const selectDocument = useCallback(() => {
    onPanelClose()
    if (!drawer) focusReader()
  }, [drawer, focusReader, onPanelClose])
  return (
    <div className={`library${hasDocument ? ' has-document' : ''}`}>
      {hasDocument && <div className={`library-panel-scrim mobile-drawer-scrim${panelOpen ? ' is-open' : ''}`} onClick={onPanelClose} aria-hidden="true" />}
      <FileList
        key={kind}
        kind={kind}
        files={files}
        path={path}
        loading={!current}
        error={current?.error}
        onRetry={() => { invalidateLibrary(); setList(null); setRevision((value) => value + 1) }}
        navigation={navigation}
        drawer={drawer}
        panelOpen={panelOpen}
        panelRef={panelRef}
        onPanelClose={onPanelClose}
        onSelect={selectDocument}
      />
      <Reader
        key={entryKey}
        entryKey={entryKey}
        kind={kind}
        path={path}
        selected={selected}
        navigation={navigation}
        inert={panelOpen}
        pendingReference={pendingReference}
        referenceError={referenceError}
        onReferenceRetry={onReferenceRetry}
        scrollRef={readerScrollRef}
      />
    </div>
  )
}
