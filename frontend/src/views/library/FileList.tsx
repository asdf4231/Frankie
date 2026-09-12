import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  onSelect: (path: string) => void
}

export default function FileList({ kind, files, path, loading, error, onSelect }: Props) {
  const [search, setSearch] = useState({ path, value: '' })
  // A linked document outside the current results must become visible when navigation selects it.
  if (search.path !== path) {
    const selected = files.find((file) => file.path === path)
    setSearch({ path, value: !path || selected?.searchText.includes(search.value.trim().toLowerCase()) ? search.value : '' })
  }
  const query = useDeferredValue(search.value).trim().toLowerCase()
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

  const activeRef = useRef<HTMLButtonElement>(null)
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
        <label className="search focus-field">
          <Icon name="search" size={16} />
          <input
            value={search.value}
            onChange={(event) => setSearch({ path, value: event.target.value })}
            placeholder={`搜索${kind === 'wiki' ? ' Wiki' : '课件'}…`}
            aria-label={`搜索${label}`}
          />
          {search.value && (
            <button type="button" className="btn-icon btn-icon-sm" onClick={() => setSearch({ path, value: '' })} aria-label={`清空${label}搜索`}>
              <Icon name="x" size={16} />
            </button>
          )}
        </label>
      </div>
      <div ref={listRef} className="library-list" aria-busy={loading}>
        {loading ? (
          <div className="library-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在加载文件列表</span></div>
        ) : error ? (
          <div className="library-error" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span></div>
        ) : filteredGroups.length === 0 ? (
          <p className="library-state">{query ? '没有匹配结果' : kind === 'wiki' ? '暂无笔记' : '暂无课件'}</p>
        ) : filteredGroups.map((group) => (
          <div key={group.key}>
            {group.title && <div className="group-label library-group-label"><span>{group.title}</span><span>{group.files.length}</span></div>}
            {group.files.map((file) => (
              <button
                ref={file.path === path ? activeRef : undefined}
                key={file.path}
                type="button"
                className="list-item library-file"
                aria-current={file.path === path ? 'page' : undefined}
                onClick={() => onSelect(file.path)}
                title={file.title}
              >
                <span className="list-item-label">{file.title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
