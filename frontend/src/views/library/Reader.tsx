import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../../components/Icon'
import MessageContent from '../../components/MessageContent'
import { getDocumentCached } from '../../lib/cache'
import { errorMessage, type DocumentHeading } from '../../api/client'
import { formatDocumentDate } from '../../lib/dates'
import { splitFrontmatter, type DocumentContent } from '../../lib/frontmatter'
import { ANCHOR_NAVIGATION_EVENT, followRoute, routeHref, useRoute } from '../../lib/router'
import type { LibraryFile, LibraryKind } from './FileList'
import { topicTitle } from './topics'

const scrollPositions = new Map<string, number>()

type LoadedDocument = DocumentContent & { headings: DocumentHeading[] }

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
  const [load, setLoad] = useState<{ path?: string; document?: LoadedDocument; error?: string }>({})
  const document = load.path === path ? load.document ?? null : null
  const error = load.path === path ? load.error ?? '' : ''
  const [navigationError, setNavigationError] = useState('')
  const [revision, setRevision] = useState(0)
  const backRef = useRef<HTMLAnchorElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<HTMLElement>(null)
  const scrollTop = useRef(0)

  const scrollToAnchor = useCallback((anchor: string | undefined, restoreSavedPosition: boolean) => {
    const container = scrollRef.current
    const article = documentRef.current
    if (!document || !container || !article) return
    const target = anchor ? article.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`) : null
    setNavigationError(anchor && !target ? `The section “${anchor}” could not be found in this document.` : '')

    if (restoreSavedPosition && scrollPositions.has(entryKey)) {
      container.scrollTop = scrollPositions.get(entryKey)!
    } else if (target) {
      container.scrollTop += target.getBoundingClientRect().top - container.getBoundingClientRect().top
    } else {
      container.scrollTop = 0
    }
    scrollTop.current = container.scrollTop
  }, [document, entryKey])

  useLayoutEffect(() => {
    if (!document) return
    // Markdown must be laid out before restoring history or locating a backend-issued heading ID.
    scrollToAnchor(route.anchor, true)
    return () => {
      // Keep this entry's last visible offset; teardown can change the container's layout.
      scrollPositions.set(entryKey, scrollTop.current)
    }
  }, [document, entryKey, route.anchor, scrollToAnchor])

  useEffect(() => {
    const repeatNavigation = (event: Event) => {
      const anchor = (event as CustomEvent<string>).detail
      if (anchor === route.anchor) scrollToAnchor(anchor, false)
    }
    window.addEventListener(ANCHOR_NAVIGATION_EVENT, repeatNavigation)
    return () => window.removeEventListener(ANCHOR_NAVIGATION_EVENT, repeatNavigation)
  }, [route.anchor, scrollToAnchor])

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    getDocumentCached(path, controller.signal)
      .then(({ content, headings }) => {
        if (!controller.signal.aborted) setLoad({ path, document: { ...splitFrontmatter(content), headings } })
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setLoad({ path, error: errorMessage(failure, 'The document could not be loaded. Check your connection and try again.') })
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
    const leading = document.body.match(/^([\t \r\n]*)# +([^\r\n]+)(?:\r?\n|$)/)
    const leadingLine = leading ? (leading[1].match(/\n/g)?.length ?? 0) + 1 : undefined
    const hiddenHeadingLine = leading?.[2].trim() === title ? leadingLine : undefined
    const titleAnchor = hiddenHeadingLine === undefined
      ? undefined
      : document.headings.find((item) => item.line === hiddenHeadingLine && item.level === 1)?.anchor
    return { title, body: document.body, hiddenHeadingLine, titleAnchor }
  }, [document, selected?.title, path])

  const topic = kind === 'wiki' && selected
    ? selected.relativePath === 'index.md' ? 'Index' : selected.relativePath.includes('/') ? selected.relativePath.split('/')[0] : ''
    : ''

  return (
    <section className="library-reader" aria-label="Document reader">
      <header className="reader-toolbar">
        <div className="reader-navigation">{navigation}</div>
        {path && (
          <a ref={backRef} className="btn btn-ghost btn-sm reader-back" href={routeHref({ ...route, view: kind, file: undefined, anchor: undefined, ref: undefined, source: undefined })} onClick={(event) => followRoute(event, { ...route, view: kind, file: undefined, anchor: undefined, ref: undefined, source: undefined })}>
            <Icon name="chevron-left" size={16} />Back
          </a>
        )}
        <div className="reader-breadcrumb" aria-label="Current location">
          <span>{kind === 'wiki' ? 'Wiki' : 'Lectures'}</span>
          {topic && <><span aria-hidden="true">/</span><span>{topicTitle(topic)}</span></>}
        </div>
      </header>
      <div
        ref={scrollRef}
        className="reader-scroll"
        tabIndex={0}
        aria-label="Document content"
        aria-busy={!!path && !document && !error}
        onScroll={(event) => { if (document) scrollTop.current = event.currentTarget.scrollTop }}
      >
        {!path ? (
          <p className="library-state reader-state">Select a file to view its content</p>
        ) : error ? (
          <div className="library-error reader-state" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLoad({ path }); setRevision((value) => value + 1) }}>Retry</button></div>
        ) : !document || !presentation ? (
          <div className="library-state reader-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Loading document</span></div>
        ) : (
          <article ref={documentRef} className="reader-document">
            {navigationError && <div className="library-error reader-link-error" role="alert"><Icon name="alert-circle" size={16} /><span>{navigationError}</span></div>}
            <header className="reader-document-header">
              <h1 id={presentation.titleAnchor}>{presentation.title}</h1>
              {(document.meta.tags.length > 0 || document.meta.date) && (
                <div className="reader-metadata">
                  {document.meta.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}
                  {document.meta.date && <time dateTime={document.meta.date}>Updated: {formatDocumentDate(document.meta.date)}</time>}
                </div>
              )}
            </header>
            <MessageContent content={presentation.body} sourcePath={path} headings={document.headings} hiddenHeadingLine={presentation.hiddenHeadingLine} />
          </article>
        )}
      </div>
    </section>
  )
}
