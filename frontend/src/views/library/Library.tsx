import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../../api/client'
import { useModalPanel } from '../../hooks/useModalPanel'
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
  const focusReader = useCallback(() => readerScrollRef.current?.focus({ preventScroll: true }), [])
  const fallbackReaderFocus = useCallback(() => readerScrollRef.current, [])
  useModalPanel({
    open: panelOpen,
    panelRef,
    onClose: onPanelClose,
    initialFocus: '[data-library-panel-close]',
    fallbackFocus: fallbackReaderFocus,
  })

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

  const current = list?.kind === kind ? list : null
  const files = current?.files ?? EMPTY_FILES
  const selected = files.find((file) => file.path === path)

  // Land on a default document (the Wiki index, the first lecture) instead of an empty reader.
  useLayoutEffect(() => {
    if (path || pendingReference || (isMobile && route.libraryList) || !current || !files.length) return
    const target = kind === 'wiki' ? files.find((file) => file.relativePath === 'index.md') ?? files[0] : files[0]
    navigate({ ...route, view: kind, file: target.path, libraryList: undefined }, { replace: true })
  }, [kind, path, pendingReference, current, files, route, isMobile])
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
