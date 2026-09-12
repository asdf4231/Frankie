import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveReferenceCached } from '../lib/cache'

interface Props {
  index: number
  target: string
  onOpen?: (target: string) => void
}

/** Inline source marker. Hover state stays local, without re-rendering the surrounding Markdown. */
export default function Citation({ index, target, onOpen }: Props) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const hovered = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const frame = useRef(0)
  const request = useRef(0)
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    request.current += 1
    hovered.current = false
    clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)
    setOpen(false)
  }, [])

  const show = () => {
    clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)
    const current = ++request.current
    resolveReferenceCached(target)
      .then((page) => page.title.trim() || '课程资料')
      .catch(() => '来源暂不可用')
      .then((pageTitle) => {
        if (current !== request.current) return
        // Wait for keyboard focus to scroll the marker into view.
        frame.current = requestAnimationFrame(() => {
          if (current !== request.current || !triggerRef.current?.getClientRects().length) return
          setTitle(pageTitle)
          setOpen(true)
        })
      })
  }

  // Size the bubble to its title, then position it before paint.
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

  const keepOpen = () => {
    hovered.current = true
    clearTimeout(timer.current)
  }
  const scheduleClose = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!hovered.current && document.activeElement !== triggerRef.current) close()
    }, 150)
  }
  const leave = () => {
    hovered.current = false
    scheduleClose()
  }

  useEffect(() => () => {
    request.current += 1
    clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const outside = (event: PointerEvent) => {
      const node = event.target as Node
      if (!triggerRef.current?.contains(node) && !tooltipRef.current?.contains(node)) close()
    }
    const scroll = (event: Event) => {
      if (!tooltipRef.current?.contains(event.target as Node)) close()
    }
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
      <button
        ref={triggerRef}
        type="button"
        className="cite"
        aria-label={`来源 ${index}${title ? `：${title}` : ''}`}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => { if (event.pointerType !== 'touch') { keepOpen(); show() } }}
        onPointerLeave={leave}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={() => { close(); onOpen?.(target) }}
      >
        {index}
      </button>
      {open && createPortal(
        <span ref={tooltipRef} id={id} role="tooltip" className="cite-tooltip" onPointerEnter={keepOpen} onPointerLeave={leave}>
          {title}
        </span>,
        document.body,
      )}
    </>
  )
}
