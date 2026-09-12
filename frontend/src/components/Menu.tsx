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
const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)'

/** Anchored popover menu rendered in a portal with fixed positioning, so it is never clipped by a
 * scrolling ancestor. Closes on outside click, Escape, scroll, resize, or choosing an item. */
export default function Menu<T extends HTMLElement = HTMLButtonElement>({
  renderTrigger, children, side = 'bottom', align = 'start', matchTriggerWidth = false,
}: MenuProps<T>) {
  const [position, setPosition] = useState<CSSProperties | null>(null)
  const triggerRef = useRef<T>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = position !== null
  const close = useCallback(() => setPosition(null), [])

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
    const style: CSSProperties = {}
    if (openUpward) style.bottom = window.innerHeight - rect.top + GAP
    else style.top = rect.bottom + GAP
    if (align === 'end') style.right = window.innerWidth - rect.right
    else style.left = rect.left
    if (matchTriggerWidth) style.minWidth = rect.width
    setPosition(style)
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
      close()
      triggerRef.current?.focus()
    }
    const dismiss = () => close()
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open, close])

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
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
      {open && createPortal(
        <CloseContext.Provider value={close}>
          <div ref={menuRef} className="menu" role="menu" style={position} onKeyDown={moveFocus}>
            {typeof children === 'function' ? children(close) : children}
          </div>
        </CloseContext.Provider>,
        document.body,
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
  onSelect?: () => void
  children: ReactNode
}

export function MenuItem({ icon, danger, keepOpen, disabled, onSelect, children }: ItemProps) {
  const close = useContext(CloseContext)
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`menu-item${danger ? ' menu-item-danger' : ''}`}
      onClick={() => {
        if (!keepOpen) close()
        onSelect?.()
      }}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="menu-separator" role="separator" />
}
