import { useCallback, useEffect, useState } from 'react'
import { getSourcesCached, getWikiCached } from '../../lib/cache'
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

export default function Library({ kind }: { kind: LibraryKind }) {
  const { file: path, entryKey } = useRoute()
  const [list, setList] = useState<ListState | null>(null)

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
        if (active) setList({ kind, files: [], error: error instanceof Error ? error.message : String(error) })
      })
    return () => { active = false }
  }, [kind])

  const current = list?.kind === kind ? list : null
  const files = current?.files ?? EMPTY_FILES
  const selected = files.find((file) => file.path === path)
  const select = useCallback((file: string) => navigate({ view: kind, file }), [kind])

  return (
    <div className={`library${path ? ' has-document' : ''}`}>
      <FileList key={kind} kind={kind} files={files} path={path} loading={!current} error={current?.error} onSelect={select} />
      <Reader key={entryKey} entryKey={entryKey} kind={kind} path={path} selected={selected} />
    </div>
  )
}
