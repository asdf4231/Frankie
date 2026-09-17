import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { formatCount } from '../../lib/dates'
import { consumeNavigationIntent, followRoute, isUnmodifiedPrimaryClick, navigate, routeHref, useRoute } from '../../lib/router'
import Icon from '../../components/Icon'
import { topicTitle } from './topics'

export type LibraryKind = 'wiki' | 'lectures'
export interface LibraryFile {
  path: string
  relativePath: string
  title: string
  firstLecture?: number
  searchText: string
}

interface Props {
  kind: LibraryKind
  files: LibraryFile[]
  path?: string
  loading: boolean
  error?: string
  onRetry: () => void
  navigation?: ReactNode
  drawer: boolean
  panelOpen: boolean
  panelRef: RefObject<HTMLElement | null>
  onPanelClose: () => void
  onSelect: () => void
}

export default function FileList({ kind, files, path, loading, error, onRetry, navigation, drawer, panelOpen, panelRef, onPanelClose, onSelect }: Props) {
  const route = useRoute()
  const search = route.librarySearch ?? ''
  const selected = files.find((file) => file.path === path)
  const query = useDeferredValue(search).trim().toLocaleLowerCase()
  const setSearch = (value: string) => navigate({ ...route, librarySearch: value || undefined }, { replace: true })
  useEffect(() => {
    if (!selected) return
    const navigation = consumeNavigationIntent(route.entryKey, 'document')
    if (!navigation) return
    const normalized = search.trim().toLocaleLowerCase()
    if (selected.path !== navigation.fromFile && normalized && !selected.searchText.includes(normalized)) navigate({ ...route, librarySearch: undefined }, { replace: true })
  }, [selected, search, route])
  const groups = useMemo(() => {
    if (!files.length) return []
    if (kind === 'lectures') return [{ key: 'lectures', title: '', files }]
    const byDirectory = new Map<string, LibraryFile[]>()
    for (const file of files) {
      const key = file.relativePath === 'index.md' ? '/index' : file.relativePath.includes('/') ? file.relativePath.split('/')[0] : '/root'
      const group = byDirectory.get(key) ?? []
      group.push(file)
      byDirectory.set(key, group)
    }
    // The index and root documents (Course) come first; topic groups keep lecture order.
    const rank = (key: string) => (key === '/index' ? 0 : key === '/root' ? 1 : 2)
    return Array.from(byDirectory, ([key, entries]) => ({
      key,
      title: key === '/index' ? 'Index' : key === '/root' ? 'Course' : topicTitle(key),
      firstLecture: Math.min(...entries.map((file) => file.firstLecture ?? Infinity)),
      files: entries,
    })).sort((a, b) => rank(a.key) - rank(b.key)
      || a.firstLecture - b.firstLecture || a.title.localeCompare(b.title))
  }, [kind, files])
  // Establish folder order from all articles before filtering, so search never reshuffles topics.
  const filteredGroups = useMemo(() => query
    ? groups.map((group) => ({ ...group, files: group.files.filter((file) => file.searchText.includes(query)) })).filter((group) => group.files.length)
    : groups, [groups, query])

  const activeRef = useRef<HTMLAnchorElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollToActive = useCallback(() => {
    if (drawer && !panelOpen) return
    const active = activeRef.current
    if (active?.getClientRects().length) active.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [drawer, panelOpen])
  useLayoutEffect(scrollToActive, [path, filteredGroups, scrollToActive])
  useLayoutEffect(() => {
    const observer = new ResizeObserver(scrollToActive)
    if (listRef.current) observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [scrollToActive])
  useLayoutEffect(() => {
    const list = listRef.current
    if (!path && !drawer && list?.getClientRects().length) list.focus({ preventScroll: true })
  }, [drawer, path])

  const label = kind === 'wiki' ? 'Wiki' : 'Lectures'
  return (
    <aside
      ref={panelRef}
      className={`library-list-pane${drawer ? ` mobile-drawer${panelOpen ? ' is-open' : ''}` : ''}`}
      aria-label={`${label} file list`}
      role={drawer && panelOpen ? 'dialog' : undefined}
      aria-modal={drawer && panelOpen ? true : undefined}
      aria-hidden={drawer && !panelOpen ? true : undefined}
      inert={drawer && !panelOpen}
    >
      <div className="library-search-row">
        {drawer && (
          <button type="button" className="btn-icon" data-library-panel-close aria-label={`Close ${label} file list`} onClick={onPanelClose}>
            <Icon name="x" />
          </button>
        )}
        {navigation}
        <label className="search focus-field">
          <Icon name="search" size={16} />
          <input
            name={`${kind}-search`}
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={kind === 'wiki' ? 'Search Wiki, e.g. Bellman…' : 'Search lectures, e.g. Lecture 4…'}
            aria-label={`Search ${label}`}
          />
          {search && (
            <button type="button" className="btn-icon btn-icon-sm" onClick={() => setSearch('')} aria-label={`Clear ${label} search`}>
              <Icon name="x" size={16} />
            </button>
          )}
        </label>
      </div>
      <span className="visually-hidden" role="status">{query && !loading ? `${formatCount(filteredGroups.reduce((total, group) => total + group.files.length, 0), 'result')} found` : ''}</span>
      <div ref={listRef} className="library-list" tabIndex={0} aria-label={`${label} files`} aria-busy={loading}>
        {loading ? (
          <div className="library-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Loading file list</span></div>
        ) : error ? (
          <div className="library-error" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>Retry</button></div>
        ) : filteredGroups.length === 0 ? (
          <p className="library-state">{query ? 'No matching results' : kind === 'wiki' ? 'No notes yet' : 'No lectures yet'}</p>
        ) : filteredGroups.map((group) => (
          <div key={group.key}>
            {group.title && <div className="group-label library-group-label"><span>{group.title}</span><span>{group.files.length}</span></div>}
            {group.files.map((file) => (
              <a
                ref={file.path === path ? activeRef : undefined}
                data-library-path={file.path}
                key={file.path}
                className="list-item library-file content-auto"
                href={routeHref({ ...route, view: kind, file: file.path, anchor: undefined, ref: undefined, source: undefined, librarySearch: search || undefined, libraryList: undefined })}
                aria-current={file.path === path ? 'page' : undefined}
                onClick={(event) => {
                  if (isUnmodifiedPrimaryClick(event)) onSelect()
                  followRoute(event, { ...route, view: kind, file: file.path, anchor: undefined, ref: undefined, source: undefined, librarySearch: search || undefined, libraryList: undefined }, { intent: 'document', fromFile: path })
                }}
                title={file.title}
              >
                <span className="list-item-label">{file.title}</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
