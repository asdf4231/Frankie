import { useCallback, useEffect, useLayoutEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'

const PAGE_FRACTION = 0.85
const PAGE_DURATION_MS = 160
const NATIVE_SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', ' '])
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const EXCLUDED_SELECTOR = '[role="menu"], [role="menuitem"], [role="dialog"][aria-modal="true"]'

type Direction = -1 | 1

interface Animation {
  frame: number
  startedAt: number
  start: number
  target: number
  direction: Direction
}

interface Options {
  enabled?: boolean
  allowEditable?: boolean
  onSettled?: () => void
}

/** Shared, bounded keyboard paging for the app's reading panes. */
export function usePagingScroll(
  scrollRef: RefObject<HTMLElement | null>,
  { enabled = true, allowEditable = false, onSettled }: Options = {},
) {
  const animation = useRef<Animation | null>(null)
  const isPaging = useRef(false)

  const stop = useCallback(() => {
    const current = animation.current
    if (current) cancelAnimationFrame(current.frame)
    animation.current = null
    // Let position restoration observe the final frame before releasing paging ownership.
    if (current) onSettled?.()
    isPaging.current = false
  }, [onSettled])

  const scrollTo = useCallback((requestedTop: number, direction?: Direction) => {
    const container = scrollRef.current
    if (!enabled || !container?.clientHeight) return
    const maximum = Math.max(0, container.scrollHeight - container.clientHeight)
    const target = Math.max(0, Math.min(requestedTop, maximum))
    const start = container.scrollTop
    stop()
    if (Math.abs(target - start) < 0.5) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.scrollTop = target
      onSettled?.()
      return
    }

    const state: Animation = {
      frame: 0,
      startedAt: performance.now(),
      start,
      target,
      direction: direction ?? (target < start ? -1 : 1),
    }
    animation.current = state
    isPaging.current = true
    const step = (now: number) => {
      if (animation.current !== state) return
      const progress = Math.min(1, (now - state.startedAt) / PAGE_DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      container.scrollTop = state.start + (state.target - state.start) * eased
      if (progress < 1) state.frame = requestAnimationFrame(step)
      else {
        container.scrollTop = state.target
        stop()
      }
    }
    state.frame = requestAnimationFrame(step)
  }, [enabled, onSettled, scrollRef, stop])

  const scrollPage = useCallback((direction: Direction) => {
    const container = scrollRef.current
    if (!enabled || !container?.clientHeight) return
    const current = animation.current
    const start = current?.direction === direction ? current.target : container.scrollTop
    scrollTo(start + direction * container.clientHeight * PAGE_FRACTION, direction)
  }, [enabled, scrollRef, scrollTo])

  const handlePageKey = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229
        || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false
    if (NATIVE_SCROLL_KEYS.has(event.key)) {
      stop()
      return false
    }
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return false
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest(EXCLUDED_SELECTOR) || (!allowEditable && target?.closest(EDITABLE_SELECTOR))) return false
    scrollPage(event.key === 'PageUp' ? -1 : 1)
    return true
  }, [allowEditable, scrollPage, stop])

  const onKeyDownCapture = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (handlePageKey(event.nativeEvent)) event.preventDefault()
  }, [handlePageKey])

  useLayoutEffect(() => {
    if (!enabled) stop()
    return stop
  }, [enabled, stop])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stop()
    }
  }, [stop])

  return { handlePageKey, isPaging, onKeyDownCapture, scrollTo, stop }
}
