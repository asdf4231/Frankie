import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { followRoute, routeHref, type Route } from '../lib/router'
import Icon, { type IconName } from './Icon'

export interface TriggerProps<T extends HTMLElement> {
  ref: RefObject<T | null>
  onClick: () => void
  'aria-haspopup': 'menu'
  'aria-expanded': boolean
}

interface MenuProps<T extends HTMLElement> {
  /** The element that opens the menu; spread the props onto a button. */
  renderTrigger: (props: TriggerProps<T>) => ReactElement
  children: ReactNode | ((close: () => void) => ReactNode)
  /** Preferred side; flips when there is no room. */
  side?: 'bottom' | 'top'
  align?: 'start' | 'end'
  matchTriggerWidth?: boolean
}

const CloseContext = createContext<() => void>(() => {})
const GAP = 4
const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)'

/** Anchored popover menu rendered in a portal with fixed positioning, so it is never clipped by a
 * scrolling ancestor. Closes on outside click, Escape, scroll, resize, or choosing an item. */
export default function Menu<T extends HTMLElement = HTMLButtonElement>({
  renderTrigger, children, side = 'bottom', align = 'start', matchTriggerWidth = false,
}: MenuProps<T>) {
  const [popover, setPopover] = useState<{ position: CSSProperties; container: Element } | null>(null)
  const triggerRef = useRef<T>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = popover !== null
  const close = useCallback(() => setPopover(null), [])
  const closeAndFocusTrigger = useCallback(() => {
    close()
    triggerRef.current?.focus({ preventScroll: true })
  }, [close])

  const toggle = () => {
    if (open) {
      close()
      return
    }
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = side === 'top' ? rect.top > spaceBelow : spaceBelow < 200 && rect.top > spaceBelow
    const style: CSSProperties = { maxHeight: Math.max(0, (openUpward ? rect.top : spaceBelow) - GAP - 8) }
    if (openUpward) style.bottom = window.innerHeight - rect.top + GAP
    else style.top = rect.bottom + GAP
    if (align === 'end') style.right = window.innerWidth - rect.right
    else style.left = rect.left
    const availableWidth = Math.max(0, (align === 'end' ? rect.right : window.innerWidth - rect.left) - 8)
    style.maxWidth = availableWidth
    style.minWidth = Math.min(matchTriggerWidth ? rect.width : 180, availableWidth)
    if (matchTriggerWidth) style.width = style.minWidth
    setPopover({ position: style, container: trigger.closest('[role="dialog"]') ?? document.body })
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closeAndFocusTrigger()
    }
    const dismiss = () => close()
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return
      close()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', dismiss)
    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open, close, closeAndFocusTrigger])

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      closeAndFocusTrigger()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])
    if (items.length === 0) return
    event.preventDefault()
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
        : event.key === 'ArrowDown' ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length
    items[next].focus()
  }

  return (
    <>
      {renderTrigger({ ref: triggerRef, onClick: toggle, 'aria-haspopup': 'menu', 'aria-expanded': open })}
      {popover && createPortal(
        <CloseContext.Provider value={closeAndFocusTrigger}>
          <div ref={menuRef} className="menu" role="menu" style={popover.position} onKeyDown={moveFocus}>
            {typeof children === 'function' ? children(close) : children}
          </div>
        </CloseContext.Provider>,
        popover.container,
      )}
    </>
  )
}

interface ItemProps {
  icon?: IconName
  danger?: boolean
  /** Stay open after selection (two-step confirmations). */
  keepOpen?: boolean
  disabled?: boolean
  /** Radio selection within a labelled menu group. */
  checked?: boolean
  onSelect?: () => void
  children: ReactNode
}

export function MenuItem({ icon, danger, keepOpen, disabled, checked, onSelect, children }: ItemProps) {
  const close = useContext(CloseContext)
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      tabIndex={-1}
      disabled={disabled}
      className={`menu-item${danger ? ' menu-item-danger' : ''}`}
      onClick={() => {
        if (!keepOpen) close()
        onSelect?.()
      }}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
      {checked && <Icon name="check" size={16} />}
    </button>
  )
}

export function MenuLink({ icon, route, children, onNavigate }: { icon?: IconName; route: Route; children: ReactNode; onNavigate?: () => void }) {
  const close = useContext(CloseContext)
  return (
    <a
      role="menuitem"
      tabIndex={-1}
      className="menu-item"
      href={routeHref(route)}
      onClick={(event) => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { close(); onNavigate?.() }
        followRoute(event, route)
      }}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </a>
  )
}

export function MenuSeparator() {
  return <div className="menu-separator" role="separator" />
}
