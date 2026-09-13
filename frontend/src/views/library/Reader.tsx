import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../../components/Icon'
import MessageContent from '../../components/MessageContent'
import { getDocumentCached } from '../../lib/cache'
import { errorMessage } from '../../api/client'
import { formatDocumentDate } from '../../lib/dates'
import { splitFrontmatter, type DocumentContent } from '../../lib/frontmatter'
import { followRoute, routeHref, useRoute } from '../../lib/router'
import type { LibraryFile, LibraryKind } from './FileList'
import { topicTitle } from './topics'

const scrollPositions = new Map<string, number>()

interface Props {
  entryKey: string
  kind: LibraryKind
  path?: string
  selected?: LibraryFile
  navigation?: ReactNode
}

/** Each history entry owns its reading position, errors and pending links. */
export default function Reader({ entryKey, kind, path, selected, navigation }: Props) {
  const route = useRoute()
  const [load, setLoad] = useState<{ path?: string; document?: DocumentContent; error?: string }>({})
  const document = load.path === path ? load.document ?? null : null
  const error = load.path === path ? load.error ?? '' : ''
  const [revision, setRevision] = useState(0)
  const backRef = useRef<HTMLAnchorElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTop = useRef(0)

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!document || !container) return
    // Markdown must be laid out before applying an offset; a loading placeholder would clamp it to zero.
    container.scrollTop = scrollPositions.get(entryKey) ?? 0
    scrollTop.current = container.scrollTop
    return () => {
      // Keep this entry's last visible offset; teardown can change the container's layout.
      scrollPositions.set(entryKey, scrollTop.current)
    }
  }, [document, entryKey])

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    getDocumentCached(path, controller.signal)
      .then((content) => {
        if (!controller.signal.aborted) setLoad({ path, document: splitFrontmatter(content) })
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setLoad({ path, error: errorMessage(failure, '无法加载文档，请检查网络后重试。') })
      })
    return () => { controller.abort() }
  }, [path, revision])

  useLayoutEffect(() => {
    // The list is hidden after a mobile selection; move focus into the visible reader.
    if (path && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true })
  }, [path])

  const presentation = useMemo(() => {
    if (!document) return null
    const heading = document.body.match(/^# +(.+)$/m)?.[1]?.trim()
    const title = document.meta.title || heading || selected?.title || path?.replace(/\\/g, '/').split('/').pop() || ''
    const leading = document.body.match(/^\s*# +([^\r\n]+)(?:\r?\n|$)/)
    const body = leading?.[1].trim() === title ? document.body.slice(leading[0].length).trimStart() : document.body
    return { title, body }
  }, [document, selected?.title, path])

  const topic = kind === 'wiki' && selected
    ? selected.relativePath === 'index.md' ? '索引' : selected.relativePath.includes('/') ? selected.relativePath.split('/')[0] : ''
    : ''

  return (
    <section className="library-reader" aria-label="文档阅读器">
      <header className="reader-toolbar">
        <div className="reader-navigation">{navigation}</div>
        {path && (
          <a ref={backRef} className="btn btn-ghost btn-sm reader-back" href={routeHref({ ...route, view: kind, file: undefined, ref: undefined, source: undefined })} onClick={(event) => followRoute(event, { ...route, view: kind, file: undefined, ref: undefined, source: undefined })}>
            <Icon name="chevron-left" size={16} />返回
          </a>
        )}
        <div className="reader-breadcrumb" aria-label="当前位置">
          <span>{kind === 'wiki' ? 'Wiki' : '课件'}</span>
          {topic && <><span aria-hidden="true">/</span><span>{topicTitle(topic)}</span></>}
        </div>
      </header>
      <div
        ref={scrollRef}
        className="reader-scroll"
        tabIndex={0}
        aria-label="文档内容"
        aria-busy={!!path && !document && !error}
        onScroll={(event) => { if (document) scrollTop.current = event.currentTarget.scrollTop }}
      >
        {!path ? (
          <p className="library-state reader-state">选择左侧文件查看内容</p>
        ) : error ? (
          <div className="library-error reader-state" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLoad({ path }); setRevision((value) => value + 1) }}>重试</button></div>
        ) : !document || !presentation ? (
          <div className="library-state reader-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在加载文档</span></div>
        ) : (
          <article className="reader-document">
            <header className="reader-document-header">
              <h1>{presentation.title}</h1>
              {(document.meta.tags.length > 0 || document.meta.date) && (
                <div className="reader-metadata">
                  {document.meta.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}
                  {document.meta.date && <time dateTime={document.meta.date}>更新：{formatDocumentDate(document.meta.date)}</time>}
                </div>
              )}
            </header>
            <MessageContent content={presentation.body} sourcePath={path} />
          </article>
        )}
      </div>
    </section>
  )
}
