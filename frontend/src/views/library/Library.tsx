import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '../../api/client'
import { getSourcesCached, getWikiCached, invalidateLibrary } from '../../lib/cache'
import { useRoute } from '../../lib/router'
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

export default function Library({ kind, navigation }: { kind: LibraryKind; navigation?: ReactNode }) {
  const { file: path, entryKey } = useRoute()
  const [list, setList] = useState<ListState | null>(null)
  const [revision, setRevision] = useState(0)
  const previousPath = useRef<string | undefined>(path)

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
        if (active) setList({ kind, files: [], error: errorMessage(error, '无法加载文件列表，请检查网络后重试。') })
      })
    return () => { active = false }
  }, [kind, revision])

  useLayoutEffect(() => {
    const previous = previousPath.current
    if (!path && previous) {
      const target = document.querySelector<HTMLAnchorElement>(`[data-library-path="${CSS.escape(previous)}"]`)
        ?? document.querySelector<HTMLInputElement>(`[name="${kind}-search"]`)
      target?.focus({ preventScroll: true })
    }
    previousPath.current = path
  }, [path, kind])

  const current = list?.kind === kind ? list : null
  const files = current?.files ?? EMPTY_FILES
  const selected = files.find((file) => file.path === path)
  return (
    <div className={`library${path ? ' has-document' : ''}`}>
      <FileList key={kind} kind={kind} files={files} path={path} loading={!current} error={current?.error} onRetry={() => { invalidateLibrary(); setList(null); setRevision((value) => value + 1) }} navigation={navigation} />
      <Reader key={entryKey} entryKey={entryKey} kind={kind} path={path} selected={selected} navigation={navigation} />
    </div>
  )
}
