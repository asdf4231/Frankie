import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getResolvedReference, resolveReferenceCached, type ResolvedReference } from '../lib/cache'
import { followRoute, pendingReferenceRoute, routeHref, useRoute, viewForRelPath } from '../lib/router'

interface Props {
  index: number
  target: string
  sourcePath?: string
}

/** Inline source marker. Resolve metadata only on hover/focus or after navigation. */
export default function Citation({ index, target, sourcePath }: Props) {
  const id = useId()
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const hovered = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const referenceKey = `${target}\n${sourcePath ?? ''}`
  const [open, setOpen] = useState(false)
  const [resolution, setResolution] = useState<{ key: string; page?: ResolvedReference; loading: boolean }>(() => ({
    key: referenceKey,
    page: getResolvedReference(target, sourcePath),
    loading: false,
  }))
  const request = useRef(0)
  const resolved = resolution.key === referenceKey ? resolution.page : undefined
  const loading = resolution.key === referenceKey && resolution.loading
  const currentRoute = useRoute()
  const { librarySearch, sidebarSearch } = currentRoute
  const route = resolved
    ? { view: viewForRelPath(resolved.rel_path), file: resolved.abs_path, librarySearch, sidebarSearch } as const
    : { ...pendingReferenceRoute(target, sourcePath), librarySearch, sidebarSearch }
  const title = resolved?.title.trim() || (loading ? '正在加载来源标题…' : '课程资料来源')

  const close = useCallback(() => {
    hovered.current = false
    clearTimeout(timer.current)
    setOpen(false)
  }, [])
  const show = () => {
    const cached = getResolvedReference(target, sourcePath)
    setOpen(true)
    if (cached) {
      request.current += 1
      setResolution({ key: referenceKey, page: cached, loading: false })
      return
    }
    const current = ++request.current
    setResolution({ key: referenceKey, loading: true })
    resolveReferenceCached(target, sourcePath)
      .then((page) => {
        if (request.current === current) setResolution({ key: referenceKey, page, loading: false })
      })
      .catch(() => {
        if (request.current === current) setResolution({ key: referenceKey, loading: false })
      })
  }
  const keepOpen = () => { hovered.current = true; clearTimeout(timer.current) }
  const scheduleClose = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!hovered.current && document.activeElement !== triggerRef.current) close()
    }, 150)
  }

  useLayoutEffect(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!open || !trigger || !tooltip) return
    const rect = trigger.getBoundingClientRect()
    const width = tooltip.getBoundingClientRect().width
    const below = window.innerHeight - rect.bottom
    const above = rect.top > below
    Object.assign(tooltip.style, {
      left: `${Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8))}px`,
      top: above ? 'auto' : `${rect.bottom + 8}px`,
      bottom: above ? `${window.innerHeight - rect.top + 8}px` : 'auto',
      maxHeight: `${Math.max(0, (above ? rect.top : below) - 16)}px`,
    })
  }, [open, title])

  useEffect(() => () => { request.current += 1; clearTimeout(timer.current) }, [])
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    const outside = (event: PointerEvent) => {
      const node = event.target as Node
      if (!triggerRef.current?.contains(node) && !tooltipRef.current?.contains(node)) close()
    }
    const scroll = (event: Event) => { if (!tooltipRef.current?.contains(event.target as Node)) close() }
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', outside, true)
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    return () => {
      document.removeEventListener('keydown', escape)
      document.removeEventListener('pointerdown', outside, true)
      window.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
    }
  }, [open, close])

  return (
    <>
      <a
        ref={triggerRef}
        className="cite"
        href={routeHref(route)}
        aria-label={`来源 ${index}：${title}`}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => { if (event.pointerType !== 'touch') { keepOpen(); show() } }}
        onPointerLeave={() => { hovered.current = false; scheduleClose() }}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={(event) => { close(); followRoute(event, route, { intent: 'document', fromFile: currentRoute.file }) }}
      >
        {index}
      </a>
      {open && createPortal(
        <span ref={tooltipRef} id={id} role="tooltip" className="cite-tooltip" onPointerEnter={keepOpen} onPointerLeave={() => { hovered.current = false; scheduleClose() }}>
          {title}
        </span>,
        document.body,
      )}
    </>
  )
}
