import { useLayoutEffect, type RefObject } from 'react'

const FOCUSABLE = 'button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled), [tabindex="0"]'

const visibleFocusTarget = (target: HTMLElement | null | undefined) =>
  target?.isConnected && !target.closest('[inert], [aria-hidden="true"]') && target.getClientRects().length
    ? target
    : null

interface Options {
  open: boolean
  panelRef: RefObject<HTMLElement | null>
  onClose: () => void
  initialFocus: string
  /** When supplied, this explicit opener replaces automatic active-element capture. */
  openerRef?: RefObject<HTMLElement | null>
  fallbackFocus?: () => HTMLElement | null
}

/** Shared keyboard containment and focus restoration for modal drawers. */
export function useModalPanel({ open, panelRef, onClose, initialFocus, openerRef, fallbackFocus }: Options) {
  useLayoutEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const opener = openerRef
      ? openerRef.current
      : document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((item) => item.getClientRects().length > 0)
      if (!items.length) return
      const active = document.activeElement as HTMLElement
      const outside = !items.includes(active)
      const target = event.shiftKey
        ? outside || active === items[0] ? items.at(-1) : undefined
        : outside || active === items.at(-1) ? items[0] : undefined
      if (target) {
        event.preventDefault()
        target.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    panel.querySelector<HTMLElement>(initialFocus)?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const target = visibleFocusTarget(opener) ?? visibleFocusTarget(fallbackFocus?.())
      target?.focus({ preventScroll: true })
    }
  }, [fallbackFocus, initialFocus, onClose, open, openerRef, panelRef])
}
