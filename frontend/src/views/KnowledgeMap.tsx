import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { errorMessage, type WikiGraph, type WikiGraphNode } from '../api/client'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import { getWikiGraphCached } from '../lib/cache'
import { followRoute, navigate, routeHref, useRoute, type Route } from '../lib/router'
import { compareIndexOrder, topicTitle } from './library/topics'
import './KnowledgeMap.css'

type Edge = WikiGraph['edges'][number]
type MapNode = WikiGraphNode & { indexOrder?: number }
type Topic = { id: string; title: string; color: string; indexOrder: number; nodes: MapNode[] }
type Card = { id: string; title: string; topic: string; color: string; count: number; landmarks?: WikiGraphNode[] }
type Box = { x: number; y: number; width: number; height: number }
const COLORS = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)']

function graphModel(graph: WikiGraph | null) {
  const nodes = new Map(graph?.nodes.map((node) => [node.id, { ...node, indexOrder: node.index_order }]) ?? [])
  const neighbors = new Map(Array.from(nodes.keys(), (id) => [id, new Set<string>()]))
  const groups = new Map<string, MapNode[]>()
  const edges = new Map<string, Edge>()
  const topicEdges = new Map<string, Edge>()
  for (const edge of graph?.edges ?? []) {
    const source = nodes.get(edge.source)!
    const target = nodes.get(edge.target)!
    neighbors.get(source.id)!.add(target.id)
    neighbors.get(target.id)!.add(source.id)
    const pair = [source.id, target.id].sort()
    edges.set(pair.join('\n'), { source: pair[0], target: pair[1] })
    if (source.topic !== target.topic) {
      const topics = [source.topic, target.topic].sort()
      topicEdges.set(topics.join('\n'), { source: topics[0], target: topics[1] })
    }
  }
  for (const node of nodes.values()) {
    const group = groups.get(node.topic) ?? []
    group.push(node)
    groups.set(node.topic, group)
  }
  const topics: Topic[] = Array.from(groups, ([id, entries]) => ({
    id, title: topicTitle(id),
    indexOrder: Math.min(...entries.map((node) => node.indexOrder ?? Infinity)),
    nodes: entries.sort(compareIndexOrder),
  })).sort(compareIndexOrder).map((topic, index) => ({ ...topic, color: COLORS[index % COLORS.length] }))
  return { nodes, neighbors, topics, edges: [...edges.values()], topicEdges: [...topicEdges.values()] }
}

function MapSearch({ nodes, onSelect }: { nodes: WikiGraphNode[]; onSelect: (node: WikiGraphNode) => void }) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<CSSProperties>({})
  const query = search.trim().toLocaleLowerCase()
  const results = query ? nodes.filter((node) => `${node.title} ${topicTitle(node.topic)}`.toLocaleLowerCase().includes(query)) : []

  const place = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0
    const viewportWidth = viewport?.width ?? window.innerWidth
    const viewportBottom = top + (viewport?.height ?? window.innerHeight)
    const anchorTop = Math.max(top, Math.min(rect.top, viewportBottom))
    const anchorBottom = Math.max(top, Math.min(rect.bottom, viewportBottom))
    const above = anchorTop - top, below = viewportBottom - anchorBottom
    const upward = below < 240 && above > below
    const width = Math.min(320, viewportWidth - 24)
    setPosition({
      width,
      left: Math.max(left + 12, Math.min(rect.right - width, left + viewportWidth - width - 12)),
      top: upward ? undefined : anchorBottom + 8,
      bottom: upward ? window.innerHeight - anchorTop + 8 : undefined,
      maxHeight: Math.max(0, Math.min(360, (upward ? above : below) - 16)),
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && popoverRef.current?.contains(event.target)) return
      place()
    }
    const viewport = window.visualViewport
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    viewport?.addEventListener('resize', place)
    viewport?.addEventListener('scroll', place)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
      viewport?.removeEventListener('resize', place)
      viewport?.removeEventListener('scroll', place)
    }
  }, [open, place])

  const select = (node: WikiGraphNode) => {
    popoverRef.current?.hidePopover()
    onSelect(node)
  }

  return <>
    <button ref={triggerRef} type="button" className="btn-icon map-search-trigger" title="Find a concept" aria-label="Find a concept" aria-haspopup="dialog" popoverTarget={id} onClick={place}><Icon name="search" size={16} /></button>
    <div ref={popoverRef} id={id} popover="auto" role="dialog" aria-label="Find a concept" className="map-search-popover" style={position} onKeyDown={(event) => {
      // Search inputs otherwise consume Escape to clear their text before dismissing the popover.
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        popoverRef.current?.hidePopover()
        triggerRef.current?.focus({ preventScroll: true })
      }
    }} onToggle={(event) => {
      const shown = event.currentTarget.matches(':popover-open')
      setOpen(shown)
      setSearch('')
      if (shown) inputRef.current?.focus({ preventScroll: true })
    }}>
      <label className="search focus-field">
        <Icon name="search" size={16} />
        <input ref={inputRef} type="search" aria-label="Find a concept" aria-controls={query ? `${id}-results` : undefined} placeholder="Find a concept…" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) { event.preventDefault(); select(results[0]) }
        }} />
      </label>
      {query && <div id={`${id}-results`} className="map-search-results">
        <p role="status">{results.length ? `${results.length} matching concepts` : 'No concepts found. Try another term.'}</p>
        {results.map((node) => <button key={node.id} type="button" className="map-result" onClick={() => select(node)}><span>{node.title}</span><small>{topicTitle(node.topic)}</small></button>)}
      </div>}
    </div>
  </>
}

/** HTML labels stay readable and keyboard-accessible; SVG only draws the relationships. */
function MapBoard({ cards, edges, focusId, overview, onSelect, onLandmark }: {
  cards: Card[]
  edges: Edge[]
  focusId?: string
  overview: boolean
  onSelect: (id: string) => void
  onLandmark: (node: WikiGraphNode) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const [hovered, setHovered] = useState<string | null>(null)
  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(() => {
      const origin = board.getBoundingClientRect()
      const measured: Record<string, Box> = {}
      for (const element of board.querySelectorAll<HTMLElement>('[data-map-id]')) {
        const rect = element.getBoundingClientRect()
        measured[element.dataset.mapId!] = { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height }
      }
      setBoxes(measured)
    })
    observer.observe(board)
    for (const element of board.querySelectorAll('[data-map-id]')) observer.observe(element)
    return () => observer.disconnect()
  }, [cards])

  const active = focusId ?? hovered
  const visibleEdges = edges.filter((edge) => edge.source === active || edge.target === active)
  const lit = new Set([active, ...visibleEdges.flatMap((edge) => [edge.source, edge.target])])
  const neighborCount = cards.length - 1
  const rows = Math.max(1, Math.ceil(neighborCount / 2))
  const beforeCount = Math.floor(rows / 2) * 2
  const hubRow = beforeCount ? 2 : 1
  let neighborIndex = 0
  const renderedCards = cards.map((card) => {
    const focused = card.id === focusId
    const index = focused ? 0 : neighborIndex++
    const row = Math.floor(index / 2) + 1
    const style = {
      '--map-color': card.color,
      ...(focusId ? {
        '--map-column': focused ? 2 : index % 2 === 0 ? 1 : 3,
        '--map-row': focused ? `1 / span ${rows}` : row,
        '--map-compact-row': hubRow,
      } : {}),
    } as CSSProperties
    return (
      <article
        key={card.id} data-map-id={card.id} style={style}
        className={`map-card${card.landmarks ? ' is-region' : ''}${focused ? ' is-focus' : ''}${active && !lit.has(card.id) ? ' is-muted' : ''}`}
        onMouseEnter={() => setHovered(card.id)} onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(card.id)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(null) }}
      >
        <button type="button" className="map-card-main" aria-pressed={focused || undefined} onClick={() => onSelect(card.id)}>
          <span className="map-card-meta"><span className="map-dot" />{overview ? `${card.count} pages` : card.landmarks ? `${card.count} connected concept${card.count === 1 ? '' : 's'}` : focused ? 'Selected concept' : card.topic}</span>
          <span className="map-card-title">{card.title}</span>
          {!card.landmarks && <span className="map-card-action">{card.count} connection{card.count === 1 ? '' : 's'}<Icon name="chevron-right" size={14} /></span>}
        </button>
        {card.landmarks && <div className="map-landmarks">
          {card.landmarks.map((node) => <button key={node.id} type="button" onClick={() => onLandmark(node)}>{node.title}</button>)}
        </div>}
      </article>
    )
  })

  return (
    <div ref={boardRef} className={`map-board${overview ? ' is-atlas' : ''}${focusId ? ' is-neighborhood' : ''}`}>
      <svg className="map-edges" aria-hidden="true">
        {visibleEdges.map((edge) => {
          const a = boxes[edge.source], b = boxes[edge.target]
          if (!a || !b) return null
          const x1 = a.x + a.width / 2, y1 = a.y + a.height / 2
          const x2 = b.x + b.width / 2, y2 = b.y + b.height / 2
          const mid = (x1 + x2) / 2
          return <path key={`${edge.source}\n${edge.target}`} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} />
        })}
      </svg>
      {focusId ? <>
        {renderedCards[0]}
        {[renderedCards.slice(1, beforeCount + 1), renderedCards.slice(beforeCount + 1)].flatMap((group, half) => [0, 1].map((column) => {
          const members = group.filter((_, index) => index % 2 === column)
          return members.length ? <div key={`${half}-${column}`} className="map-card-column" style={{ gridColumn: column + 1, gridRow: half === 0 ? 1 : hubRow + 1 }}>{members}</div> : null
        }))}
      </> : renderedCards}
    </div>
  )
}

export default function KnowledgeMap({ navigation, actions, notice }: {
  navigation: ReactNode
  actions: ReactNode
  notice: ReactNode
}) {
  const route = useRoute()
  const [graph, setGraph] = useState<WikiGraph | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const pageRef = useRef<HTMLDivElement>(null)
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    let active = true
    getWikiGraphCached()
      .then((graph) => { if (active) setGraph(graph) })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause, 'The knowledge map could not be loaded. Try again.'))
      })
    return () => { active = false }
  }, [retry])

  const model = useMemo(() => graphModel(graph), [graph])
  const selected = model.nodes.get(route.mapNode ?? '')
  const topic = model.topics.find((item) => item.id === (selected?.topic ?? route.mapTopic))
  const overview = !selected && !topic
  useLayoutEffect(() => {
    pageRef.current?.scrollTo({ top: 0 })
    detailHeadingRef.current?.focus({ preventScroll: true })
  }, [selected, topic])
  const connected = useMemo(() => {
    const neighbors = model.neighbors.get(selected?.id ?? '')
    return model.topics.flatMap((item) => item.nodes.filter((node) => neighbors?.has(node.id)))
  }, [model, selected])
  const popular = useMemo(() => [...model.nodes.values()].sort((a, b) => model.neighbors.get(b.id)!.size - model.neighbors.get(a.id)!.size || compareIndexOrder(a, b)), [model])
  const cards = useMemo<Card[]>(() => {
    const pageCard = (node: WikiGraphNode): Card => ({
      id: node.id, title: node.title, topic: topicTitle(node.topic),
      color: model.topics.find((item) => item.id === node.topic)!.color,
      count: model.neighbors.get(node.id)!.size,
    })
    if (overview) return model.topics.map((item) => ({
      id: item.id, title: item.title, topic: item.title, color: item.color, count: item.nodes.length,
      landmarks: popular.filter((node) => node.topic === item.id).slice(0, 2).sort(compareIndexOrder),
    }))
    if (selected) return [pageCard(selected), ...model.topics.flatMap((item) => {
      const members = connected.filter((node) => node.topic === item.id)
      return members.length ? [{ id: item.id, title: item.title, topic: item.title, color: item.color, count: members.length, landmarks: members }] : []
    })]
    return topic!.nodes.map(pageCard)
  }, [overview, model, popular, selected, connected, topic])
  const displayEdges = selected ? cards.slice(1).map((card) => ({ source: selected.id, target: card.id })) : overview ? model.topicEdges : model.edges
  const base: Route = { view: 'map', sidebarSearch: route.sidebarSearch }
  const selectNode = (node: WikiGraphNode) => navigate({ ...base, mapNode: node.id })
  const selectTopic = (id: string) => navigate({ ...base, mapTopic: id })
  const wikiRoute: Route = { view: 'wiki', file: selected?.id, sidebarSearch: route.sidebarSearch }
  const missing = (route.mapNode && !selected) || (!route.mapNode && route.mapTopic && !topic)

  let content: ReactNode
  if (error) content = <div className="app-state map-load-state" role="alert"><Icon name="alert-circle" /><p>{error}</p><button type="button" className="btn" onClick={() => { setError(''); setRetry((value) => value + 1) }}>Retry</button></div>
  else if (!graph) content = <div className="app-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Loading knowledge map</span></div>
  else if (!graph.nodes.length) content = <div className="app-state">No concept pages yet. Topic folders in the course wiki will appear here.</div>
  else content = (
    <div ref={pageRef} className="page knowledge-map">
      <header className="page-header map-page-header">
        <div><h1 className="page-title">See how the ideas connect.</h1><p className="page-lede">{graph.nodes.length} concepts. {model.topics.length} topics. One course, connected.</p></div>
        <span className="badge"><span className="map-live-dot" />Live wiki</span>
      </header>
      {missing && <p className="map-notice" role="alert">This map location no longer exists. Choose a topic or search for a concept.</p>}
      <div className={`map-workspace${!overview ? ' has-detail' : ''}`}>
        <section className="map-stage" aria-label={selected ? `${selected.title} and connected pages` : topic?.title ?? 'Course topic atlas'}>
          <div className="map-stage-heading">
            <span className="map-stage-label"><Icon name="network" size={16} />{selected ? 'Concept neighborhood' : topic ? `${topic.nodes.length} concepts` : 'Course atlas'}</span>
            <MapSearch key={selected?.id ?? topic?.id ?? 'atlas'} nodes={model.topics.flatMap((item) => item.nodes)} onSelect={selectNode} />
          </div>
          <MapBoard key={selected?.id ?? topic?.id ?? 'atlas'} cards={cards} edges={displayEdges} overview={overview} focusId={selected?.id} onSelect={(id) => model.nodes.has(id) ? selectNode(model.nodes.get(id)!) : selectTopic(id)} onLandmark={selectNode} />
          <p className="map-caption">{selected ? `${connected.length} directly connected page${connected.length === 1 ? '' : 's'}, grouped by topic. Select one to follow the connection.` : 'Hover or focus to trace connections. Select a topic or concept to look closer.'}</p>
        </section>
        <aside className="map-detail" aria-label="Map details">
          {selected ? <>
            <div className="map-detail-eyebrow" style={{ '--map-color': topic!.color } as CSSProperties}><span className="map-dot" />{topic!.title}</div>
            <h2 ref={detailHeadingRef} tabIndex={-1} className="map-detail-title">{selected.title}</h2>
            {selected.summary && <div className="map-summary"><MessageContent content={selected.summary} sourcePath={selected.id} /></div>}
            <a className="btn btn-primary map-open-page" href={routeHref(wikiRoute)} onClick={(event) => followRoute(event, wikiRoute)}><Icon name="book-open" size={16} />Open wiki page<Icon name="external-link" size={14} /></a>
          </> : topic ? <>
            <div className="map-detail-eyebrow" style={{ '--map-color': topic.color } as CSSProperties}><span className="map-dot" />Topic guide</div>
            <h2 ref={detailHeadingRef} tabIndex={-1} className="map-detail-title">{topic.title}</h2>
            <p className="map-detail-copy">Explore these {topic.nodes.length} concepts. Select a page to see its summary and connections, including those in other topics.</p>
            <div className="map-detail-links">
              <h3 className="panel-title map-section-title">In this topic</h3>
              {topic.nodes.map((node) => <button className="map-related" type="button" key={node.id} onClick={() => selectNode(node)}>{node.title}<Icon name="chevron-right" size={14} /></button>)}
            </div>
          </> : <>
            <div className="map-detail-eyebrow"><Icon name="network" size={16} />A different way to explore</div>
            <h2 className="map-detail-title">The big picture.<br />One idea at a time.</h2>
            <p className="map-detail-copy">Start with a topic, then follow a concept's connections across the course. Only the links you're exploring come into focus.</p>
            <ol className="map-guide"><li><span>01</span>Choose a topic region.</li><li><span>02</span>Select a concept to reveal its neighbors.</li><li><span>03</span>Open the wiki page to go deeper.</li></ol>
            <h3 className="panel-title map-section-title">Well-connected starting points</h3>
            {popular.slice(0, 4).map((node) => <button className="map-result" type="button" key={node.id} onClick={() => selectNode(node)}><span>{node.title}</span><small>{model.neighbors.get(node.id)!.size} connections · {topicTitle(node.topic)}</small></button>)}
          </>}
        </aside>
      </div>
    </div>
  )

  return (
    <>
      <header className="shell-header map-header">
        {navigation}
        <nav className="shell-title breadcrumb map-breadcrumb" aria-label="Breadcrumb">
          <a href={routeHref(base)} aria-current={overview ? 'page' : undefined} onClick={(event) => followRoute(event, base)}>Knowledge Map</a>
          {topic && <><Icon name="chevron-right" size={14} /><a href={routeHref({ ...base, mapTopic: topic.id })} aria-current={!selected ? 'page' : undefined} onClick={(event) => followRoute(event, { ...base, mapTopic: topic.id })}>{topic.title}</a></>}
          {selected && <><Icon name="chevron-right" size={14} /><span aria-current="page">Neighborhood</span></>}
        </nav>
        {actions}
      </header>
      {notice}
      {content}
    </>
  )
}
