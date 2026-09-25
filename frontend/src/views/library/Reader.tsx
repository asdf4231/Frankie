import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import Icon from '../../components/Icon'
import MessageContent from '../../components/MessageContent'
import { usePagingScroll } from '../../hooks/usePagingScroll'
import { getDocumentCached } from '../../lib/cache'
import { errorMessage, type DocumentHeading } from '../../api/client'
import { startQuotedChat } from '../../lib/conversation'
import { formatDocumentDate } from '../../lib/dates'
import { splitFrontmatter, type DocumentContent } from '../../lib/frontmatter'
import { mathClipboard } from '../../lib/mathCopy'
import { ANCHOR_NAVIGATION_EVENT, followRoute, navigate, routeHref, useRoute } from '../../lib/router'
import type { LibraryFile, LibraryKind } from './FileList'
import { topicTitle } from './topics'

const scrollPositions = new Map<string, number>()

type LoadedDocument = DocumentContent & { headings: DocumentHeading[] }

interface QuotePopup {
  x: number
  y: number
  text: string
  path: string
}

interface Props {
  entryKey: string
  kind: LibraryKind
  path?: string
  selected?: LibraryFile
  navigation?: ReactNode
  inert: boolean
  pendingReference: boolean
  referenceError?: string
  onReferenceRetry: () => void
  scrollRef: RefObject<HTMLDivElement | null>
}

/** Each history entry owns its reading position, errors and pending links. */
export default function Reader({ entryKey, kind, path, selected, navigation, inert, pendingReference, referenceError, onReferenceRetry, scrollRef }: Props) {
  const route = useRoute()
  const [load, setLoad] = useState<{ path?: string; document?: LoadedDocument; error?: string }>({})
  const document = load.path === path ? load.document ?? null : null
  const error = load.path === path ? load.error ?? '' : ''
  const [navigationError, setNavigationError] = useState('')
  const [revision, setRevision] = useState(0)
  const documentRef = useRef<HTMLElement>(null)
  const { onKeyDownCapture, stop: stopPaging } = usePagingScroll(scrollRef, { enabled: !inert })
  const scrollTop = useRef(0)
  const [quotePopup, setQuotePopup] = useState<QuotePopup | null>(null)

  const scrollToAnchor = useCallback((anchor: string | undefined, restoreSavedPosition: boolean) => {
    const container = scrollRef.current
    const article = documentRef.current
    if (!document || !container || !article) return
    stopPaging()
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
  }, [document, entryKey, scrollRef, stopPaging])

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
    // Route changes own focus; document loading and search edits do not.
    const container = scrollRef.current
    if (!inert && (path || pendingReference) && container?.getClientRects().length) container.focus({ preventScroll: true })
  }, [inert, path, pendingReference, scrollRef])

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

  useEffect(() => {
    const clear = () => setQuotePopup(null)
    window.document.addEventListener('mousedown', clear)
    return () => window.document.removeEventListener('mousedown', clear)
  }, [])

  const handleDocumentMouseUp = () => {
    const container = documentRef.current
    const selection = window.getSelection()
    if (!document || !path || !container || !selection || selection.isCollapsed || selection.rangeCount === 0) {
      setQuotePopup(null)
      return
    }
    const range = selection.getRangeAt(0)
    if (!container.contains(range.commonAncestorContainer)) {
      setQuotePopup(null)
      return
    }
    const markdown = container.querySelector<HTMLElement>('.md')
    const text = ((markdown ? mathClipboard(selection, [markdown])?.text : null) ?? selection.toString()).trim()
    const rect = range.getBoundingClientRect()
    if (!text || (rect.width === 0 && rect.height === 0)) {
      setQuotePopup(null)
      return
    }
    setQuotePopup({ x: rect.left + rect.width / 2, y: rect.top, text, path })
  }

  const handleQuote = () => {
    if (!quotePopup || quotePopup.path !== path || !presentation) return
    startQuotedChat({ text: quotePopup.text, source: presentation.title })
    setQuotePopup(null)
    navigate({ view: 'chat', sidebarSearch: route.sidebarSearch })
  }

  const topic = kind === 'wiki' && selected
    ? selected.relativePath === 'index.md' ? 'Index' : selected.relativePath.includes('/') ? selected.relativePath.split('/')[0] : ''
    : ''

  return (
    <section className="library-reader" aria-label="Document reader" inert={inert}>
      <header className="reader-toolbar">
        <div className="reader-navigation">{navigation}</div>
        {(path || pendingReference) && (
          <a className="btn btn-ghost btn-sm reader-back" href={routeHref({ ...route, view: kind, file: undefined, anchor: undefined, ref: undefined, source: undefined, libraryList: true })} onClick={(event) => followRoute(event, { ...route, view: kind, file: undefined, anchor: undefined, ref: undefined, source: undefined, libraryList: true })}>
            <Icon name="chevron-left" size={16} />Back
          </a>
        )}
        <div className="breadcrumb" aria-label="Current location">
          <span>{kind === 'wiki' ? 'Wiki' : 'Lectures'}</span>
          {topic && <><Icon name="chevron-right" size={14} /><span>{topicTitle(topic)}</span></>}
        </div>
      </header>
      <div
        ref={scrollRef}
        className="reader-scroll"
        tabIndex={0}
        aria-label="Document content"
        aria-busy={pendingReference ? !referenceError : !!path && !document && !error}
        onKeyDownCapture={onKeyDownCapture}
        onWheel={stopPaging}
        onTouchStart={stopPaging}
        onPointerDown={stopPaging}
        onScroll={(event) => {
          if (document) scrollTop.current = event.currentTarget.scrollTop
          setQuotePopup(null)
        }}
      >
        {!path && pendingReference ? (
          referenceError ? (
            <div className="library-error reader-state" role="alert"><Icon name="alert-circle" size={16} /><span>{referenceError}</span><button type="button" className="btn btn-ghost btn-sm" onClick={onReferenceRetry}>Retry</button></div>
          ) : (
            <div className="library-state reader-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Resolving document link</span></div>
          )
        ) : !path ? (
          <p className="library-state reader-state">Select a file to view its content</p>
        ) : error ? (
          <div className="library-error reader-state" role="alert"><Icon name="alert-circle" size={16} /><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLoad({ path }); setRevision((value) => value + 1) }}>Retry</button></div>
        ) : !document || !presentation ? (
          <div className="library-state reader-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Loading document</span></div>
        ) : (
          <article ref={documentRef} className="reader-document" onMouseUp={handleDocumentMouseUp}>
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
      {quotePopup && quotePopup.path === path && document && (
        <button
          type="button"
          className="btn btn-primary btn-sm reader-quote-button"
          style={{ left: quotePopup.x, top: quotePopup.y }}
          onMouseDown={(event) => { event.preventDefault(); event.stopPropagation() }}
          onClick={handleQuote}
          aria-label="Quote selected text in a new chat"
        >Quote</button>
      )}
    </section>
  )
}
