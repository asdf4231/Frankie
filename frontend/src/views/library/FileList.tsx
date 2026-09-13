import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { numberFormatter } from '../../lib/dates'
import { consumeNavigationIntent, followRoute, navigate, routeHref, useRoute } from '../../lib/router'
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
}

export default function FileList({ kind, files, path, loading, error, onRetry, navigation }: Props) {
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
    return Array.from(byDirectory, ([key, entries]) => ({
      key,
      title: key === '/index' ? '索引' : key === '/root' ? '课程' : topicTitle(key),
      firstLecture: Math.min(...entries.map((file) => file.firstLecture ?? Infinity)),
      files: entries,
    })).sort((a, b) => a.key === '/index' ? -1 : b.key === '/index' ? 1
      : a.firstLecture - b.firstLecture || a.title.localeCompare(b.title))
  }, [kind, files])
  // Establish folder order from all articles before filtering, so search never reshuffles topics.
  const filteredGroups = useMemo(() => query
    ? groups.map((group) => ({ ...group, files: group.files.filter((file) => file.searchText.includes(query)) })).filter((group) => group.files.length)
    : groups, [groups, query])

  const activeRef = useRef<HTMLAnchorElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollToActive = () => {
    const active = activeRef.current
    if (active?.getClientRects().length) active.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
  useLayoutEffect(scrollToActive, [path, filteredGroups])
  useLayoutEffect(() => {
    const observer = new ResizeObserver(scrollToActive)
    if (listRef.current) observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [])

  const label = kind === 'wiki' ? 'Wiki' : '课件'
  return (
    <aside className="library-list-pane" aria-label={`${label}文件列表`}>
      <div className="library-search-row">
        {navigation}
        <label className="search focus-field">
          <Icon name="search" size={16} />
          <input
            name={`${kind}-search`}
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`搜索${kind === 'wiki' ? ' Wiki，如 Bellman' : '课件，如 第 4 讲'}…`}
            aria-label={`搜索${label}`}
          />
          {search && (
            <button type="button" className="btn-icon btn-icon-sm" onClick={() => setSearch('')} aria-label={`清空${label}搜索`}>
              <Icon name="x" size={16} />
            </button>
          )}
        </label>
      </div>
      <span className="visually-hidden" role="status">{query && !loading ? `找到 ${numberFormatter.format(filteredGroups.reduce((total, group) => total + group.files.length, 0))} 个结果` : ''}</span>
      <div ref={listRef} className="library-list" aria-busy={loading}>
        {loading ? (
          <div className="library-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在加载文件列表</span></div>
        ) : error ? (
          <div className="library-error" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>重试</button></div>
        ) : filteredGroups.length === 0 ? (
          <p className="library-state">{query ? '没有匹配结果' : kind === 'wiki' ? '暂无笔记' : '暂无课件'}</p>
        ) : filteredGroups.map((group) => (
          <div key={group.key}>
            {group.title && <div className="group-label library-group-label"><span>{group.title}</span><span>{group.files.length}</span></div>}
            {group.files.map((file) => (
              <a
                ref={file.path === path ? activeRef : undefined}
                data-library-path={file.path}
                key={file.path}
                className="list-item library-file content-auto"
                href={routeHref({ ...route, view: kind, file: file.path, ref: undefined, source: undefined, librarySearch: search || undefined })}
                aria-current={file.path === path ? 'page' : undefined}
                onClick={(event) => followRoute(event, { ...route, view: kind, file: file.path, ref: undefined, source: undefined, librarySearch: search || undefined }, { intent: 'document', fromFile: path })}
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
