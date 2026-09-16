import { lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Chat from './views/chat/Chat'
import Library from './views/library/Library'
import Login from './views/Login'
import Icon from './components/Icon'
import Sidebar from './components/Sidebar'
import LazyView from './components/LazyView'
import { errorMessage, getAuthMe, logout, type AuthMe } from './api/client'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useModalPanel } from './hooks/useModalPanel'
import { useTheme } from './hooks/useTheme'
import { newChat, resetConversation, startConversationSync, useConversation } from './lib/conversation'
import { isUnmodifiedPrimaryClick, navigate, useRoute, viewForRelPath, type View } from './lib/router'
import { resolveReferenceCached } from './lib/cache'
import { resetSessions, useSessions } from './lib/sessions'

const Learning = lazy(() => import('./views/Learning'))
const Status = lazy(() => import('./views/Status'))
const Settings = lazy(() => import('./views/Settings'))
const DRAWER_SWIPE_EDGE_START = 24
const DRAWER_SWIPE_VIEWPORT_END = 0.8
const DRAWER_SWIPE_INTENT = 10
const DRAWER_SWIPE_TRAVEL = 56
const DRAWER_SWIPE_RATIO = 1.25

type SwipeDrawer = 'global' | 'library'

interface DrawerSwipe {
  id: number
  startX: number
  startY: number
  horizontal: boolean
  drawer: SwipeDrawer
  opening: boolean
}

const blocksDrawerSwipe = (target: EventTarget | null, boundary: HTMLElement) => {
  if (!(target instanceof Element)) return true
  if (target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) return true

  for (let element: Element | null = target; element && element !== boundary; element = element.parentElement) {
    if (!(element instanceof HTMLElement) || element.scrollWidth <= element.clientWidth + 1) continue
    const overflow = getComputedStyle(element).overflowX
    if (overflow === 'auto' || overflow === 'scroll') return true
  }
  return false
}

const VIEW_TITLES: Record<Exclude<View, 'chat'>, string> = {
  wiki: 'Wiki',
  lectures: 'Lectures',
  learning: 'Data',
  status: 'Status',
  settings: 'Settings',
}

/** Sidebar, header and the active view. The chat stays mounted (hidden) so a streaming reply,
 * the scroll position and the composer draft survive visits to other views. */
function Shell({ me, onLogout }: { me: AuthMe; onLogout: () => Promise<void> }) {
  const route = useRoute()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useLocalStorage('frankie.sidebar', false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const libraryPanelContext = `${isMobile}\n${route.view}\n${route.entryKey}\n${route.file ?? ''}\n${route.ref ?? ''}\n${route.source ?? ''}`
  const [openLibraryPanelContext, setOpenLibraryPanelContext] = useState<string | null>(null)
  const libraryPanelOpen = openLibraryPanelContext === libraryPanelContext
  const [routeFailure, setRouteFailure] = useState({ key: '', message: '' })
  const [referenceRetry, setReferenceRetry] = useState(0)
  const shellRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerOpener = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const closeLibraryPanel = useCallback(() => setOpenLibraryPanelContext(null), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const fallbackDrawerFocus = useCallback(() => Array.from(
    mainRef.current?.querySelectorAll<HTMLElement>('[data-sidebar-toggle]') ?? [],
  ).find((button) => !button.closest('[inert], [aria-hidden="true"]') && button.getClientRects().length > 0) ?? null, [])
  useModalPanel({
    open: isMobile && drawerOpen,
    panelRef: drawerRef,
    onClose: closeDrawer,
    initialFocus: 'button',
    openerRef: drawerOpener,
    fallbackFocus: fallbackDrawerFocus,
  })
  const sessions = useSessions()
  const conversation = useConversation()

  useEffect(() => startConversationSync(me.user_id), [me.user_id])
  useEffect(() => {
    window.addEventListener('popstate', closeLibraryPanel)
    return () => window.removeEventListener('popstate', closeLibraryPanel)
  }, [closeLibraryPanel])

  const chatEmpty = conversation.messages.length === 0 && !conversation.sessionLoading

  useLayoutEffect(() => {
    const shell = shellRef.current
    const viewport = window.visualViewport
    if (!shell || !viewport) return

    const isComposerTarget = (target: EventTarget | null) => target instanceof Element && !!target.closest('.composer')
    let composerEngaged = isComposerTarget(document.activeElement)
    const clearComposerViewport = () => {
      shell.style.removeProperty('height')
      shell.style.removeProperty('margin-top')
    }
    const updateComposerViewport = () => {
      // Leave the empty chat's centered layout to the browser rather than lifting the shell.
      if (!composerEngaged || chatEmpty || Math.abs(viewport.scale - 1) >= 0.01) {
        clearComposerViewport()
        return
      }
      // Follow visual geometry directly, without waiting for viewport-unit reflow
      // or invalidating inherited custom properties throughout the message tree.
      const height = `${viewport.height}px`
      const offset = `${viewport.offsetTop}px`
      if (shell.style.height !== height) shell.style.height = height
      if (shell.style.marginTop !== offset) shell.style.marginTop = offset
    }
    // Sample briefly during keyboard transitions in case geometry updates precede resize events.
    // This cannot compensate for browsers that delay reporting the geometry itself.
    let rafId = 0
    let pollUntil = 0
    const poll = () => {
      rafId = 0
      updateComposerViewport()
      if (performance.now() < pollUntil) rafId = requestAnimationFrame(poll)
    }
    const pollBriefly = () => {
      if (chatEmpty || !composerEngaged) return
      pollUntil = performance.now() + 1500
      if (!rafId) rafId = requestAnimationFrame(poll)
    }
    const handleFocusIn = (event: FocusEvent) => {
      composerEngaged = isComposerTarget(event.target)
      updateComposerViewport()
      pollBriefly()
    }
    const handleFocusOut = (event: FocusEvent) => {
      if (!isComposerTarget(event.target)) return
      if (isComposerTarget(event.relatedTarget)) composerEngaged = true
      else if (event.relatedTarget) composerEngaged = false
      updateComposerViewport()
      pollBriefly()
    }

    viewport.addEventListener('resize', updateComposerViewport)
    viewport.addEventListener('scroll', updateComposerViewport)
    window.addEventListener('resize', updateComposerViewport)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    updateComposerViewport()
    if (composerEngaged) pollBriefly()
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      viewport.removeEventListener('resize', updateComposerViewport)
      viewport.removeEventListener('scroll', updateComposerViewport)
      window.removeEventListener('resize', updateComposerViewport)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      clearComposerViewport()
    }
  }, [chatEmpty])

  useEffect(() => {
    if (!route.ref) return
    let active = true
    resolveReferenceCached(route.ref, route.source)
      .then((page) => {
        if (!active) return
        const current = new URLSearchParams(window.location.search)
        if (current.get('ref') !== route.ref || (current.get('source') || undefined) !== route.source) return
        navigate({ ...route, view: viewForRelPath(page.rel_path), file: page.abs_path, anchor: page.anchor || undefined, ref: undefined, source: undefined, libraryList: undefined }, { replace: true })
      })
      .catch((error: unknown) => {
        if (active) setRouteFailure({ key: `${route.ref}\n${route.source ?? ''}`, message: errorMessage(error, 'This course material could not be opened. Check the link or try again later.') })
      })
    return () => { active = false }
  }, [route, referenceRetry])

  useEffect(() => {
    const shell = shellRef.current
    if (!isMobile || !shell) return
    const gestureSurface: HTMLElement = shell
    let swipe: DrawerSwipe | null = null
    let listeningForMove = false
    const libraryView = route.view === 'wiki' || route.view === 'lectures'
    const openDrawer: SwipeDrawer | null = drawerOpen ? 'global' : libraryPanelOpen ? 'library' : null
    const openingDrawer: SwipeDrawer = libraryView && (route.file || route.ref) ? 'library' : 'global'

    function detachMove() {
      if (!listeningForMove) return
      gestureSurface.removeEventListener('touchmove', onTouchMove)
      listeningForMove = false
    }
    function cancelSwipe() {
      swipe = null
      detachMove()
    }
    function onTouchMove(event: TouchEvent) {
      if (!swipe) return
      if (event.touches.length !== 1) {
        cancelSwipe()
        return
      }
      const touch = event.touches[0]
      if (touch.identifier !== swipe.id) {
        cancelSwipe()
        return
      }
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        cancelSwipe()
        return
      }
      const dx = touch.clientX - swipe.startX
      const dy = touch.clientY - swipe.startY
      if (!swipe.horizontal) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAWER_SWIPE_INTENT) return
        const expectedDirection = swipe.opening ? dx > 0 : dx < 0
        if (!expectedDirection || Math.abs(dx) < Math.abs(dy) * DRAWER_SWIPE_RATIO) {
          cancelSwipe()
          return
        }
        swipe.horizontal = true
      }
      if (event.cancelable) event.preventDefault()
    }
    function onTouchStart(event: TouchEvent) {
      cancelSwipe()
      if (event.touches.length !== 1 || blocksDrawerSwipe(event.target, gestureSurface)) return
      const touch = event.touches[0]
      const opening = !openDrawer
      if (opening && (touch.clientX < DRAWER_SWIPE_EDGE_START || touch.clientX > window.innerWidth * DRAWER_SWIPE_VIEWPORT_END)) return
      swipe = { id: touch.identifier, startX: touch.clientX, startY: touch.clientY, horizontal: false, drawer: openDrawer ?? openingDrawer, opening }
      gestureSurface.addEventListener('touchmove', onTouchMove, { passive: false })
      listeningForMove = true
    }
    function onTouchEnd(event: TouchEvent) {
      if (!swipe || event.touches.length) {
        cancelSwipe()
        return
      }
      const completedSwipe = swipe
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === completedSwipe.id)
      if (!touch) {
        cancelSwipe()
        return
      }
      const dx = touch.clientX - completedSwipe.startX
      const dy = touch.clientY - completedSwipe.startY
      const completed = completedSwipe.horizontal
        && Math.abs(dx) >= DRAWER_SWIPE_TRAVEL
        && Math.abs(dx) >= Math.abs(dy) * DRAWER_SWIPE_RATIO
      cancelSwipe()
      if (!completed) return
      if (completedSwipe.opening && dx > 0) {
        if (completedSwipe.drawer === 'library') setOpenLibraryPanelContext(libraryPanelContext)
        else {
          drawerOpener.current = null
          setDrawerOpen(true)
        }
      } else if (!completedSwipe.opening && dx < 0) {
        if (completedSwipe.drawer === 'library') setOpenLibraryPanelContext(null)
        else setDrawerOpen(false)
      }
    }

    gestureSurface.addEventListener('touchstart', onTouchStart, { passive: true })
    gestureSurface.addEventListener('touchend', onTouchEnd, { passive: true })
    gestureSurface.addEventListener('touchcancel', cancelSwipe, { passive: true })
    return () => {
      cancelSwipe()
      gestureSurface.removeEventListener('touchstart', onTouchStart)
      gestureSurface.removeEventListener('touchend', onTouchEnd)
      gestureSurface.removeEventListener('touchcancel', cancelSwipe)
    }
  }, [drawerOpen, isMobile, libraryPanelContext, libraryPanelOpen, route.file, route.ref, route.view])

  const routeError = route.ref && routeFailure.key === `${route.ref}\n${route.source ?? ''}` ? routeFailure.message : ''
  const retryReference = useCallback(() => {
    setRouteFailure({ key: '', message: '' })
    setReferenceRetry((value) => value + 1)
  }, [])
  const startNewChat = () => {
    newChat()
    navigate({ view: 'chat', sidebarSearch: route.sidebarSearch })
    closeLibraryPanel()
    closeDrawer()
  }

  const title = route.view !== 'chat'
    ? VIEW_TITLES[route.view]
    : !route.session
      ? 'New chat'
      : sessions?.find((session) => session.session_id === route.session)?.topic
        || (conversation.sessionId === route.session ? conversation.topic : '')
        || 'Chat'

  const sidebarState = isMobile ? (drawerOpen ? ' is-open' : '') : (collapsed ? ' is-collapsed' : '')
  const isLearning = route.view === 'learning' && me.role === 'admin'
  const isLibrary = route.view === 'wiki' || route.view === 'lectures'
  const sidebarButton = (isMobile || collapsed) && (
    <button type="button" className="btn-icon" data-sidebar-toggle aria-label={isMobile ? 'Open menu' : 'Expand sidebar'} onClick={(event) => {
      if (isMobile) {
        closeLibraryPanel()
        drawerOpener.current = event.currentTarget
        setDrawerOpen(true)
      } else setCollapsed(false)
    }}>
      <Icon name="panel-left" />
    </button>
  )
  const newChatButton = (isMobile || collapsed) && (
    <button type="button" className="btn-icon" aria-label="New chat" title="New chat" onClick={startNewChat}>
      <Icon name="square-pen" />
    </button>
  )

  return (
    <div ref={shellRef} className="shell">
      <a
        className="skip-link"
        href="#main-content"
        inert={isMobile && (drawerOpen || libraryPanelOpen)}
        aria-hidden={isMobile && (drawerOpen || libraryPanelOpen) ? true : undefined}
        tabIndex={isMobile && (drawerOpen || libraryPanelOpen) ? -1 : undefined}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) return
          event.preventDefault()
          mainRef.current?.focus({ preventScroll: false })
        }}
      >Skip to main content</a>
      <div
        ref={drawerRef}
        className="sidebar-region"
        role={isMobile && drawerOpen ? 'dialog' : undefined}
        aria-modal={isMobile && drawerOpen ? true : undefined}
        aria-label={isMobile && drawerOpen ? 'Main navigation' : undefined}
        inert={isMobile ? !drawerOpen : collapsed}
      >
        <div className={`scrim mobile-drawer-scrim${isMobile && drawerOpen ? ' is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />
        <aside className={`sidebar mobile-drawer${sidebarState}`} aria-label="Sidebar">
          <Sidebar
            me={me}
            activeView={route.view}
            activeSession={route.session}
            onNavigate={closeDrawer}
            onCollapse={() => (isMobile ? closeDrawer() : setCollapsed(true))}
            onLogout={onLogout}
          />
        </aside>
      </div>

      <main id="main-content" ref={mainRef} className="shell-main" inert={isMobile && drawerOpen} tabIndex={-1}>
        {!isLearning && !isLibrary && <header className="shell-header">
          {sidebarButton}
          {!isMobile && newChatButton}
          {route.view === 'chat' ? <h1 className="shell-title">{title}</h1> : <div className="shell-title">{title}</div>}
          {isMobile && newChatButton}
        </header>}

        <div className="shell-body">
          {routeError && !isLibrary && <div className="route-error" role="alert"><Icon name="alert-circle" size={16} /><span>{routeError}</span><button type="button" className="btn btn-ghost btn-sm" onClick={retryReference}>Retry</button></div>}
          <div className="view-host" hidden={route.view !== 'chat'}>
            <Chat me={me} />
          </div>
          {(route.view === 'wiki' || route.view === 'lectures') && (
            <div className="view-host"><Library kind={route.view} navigation={<>{sidebarButton}{newChatButton}</>} isMobile={isMobile} panelOpen={libraryPanelOpen} onPanelClose={closeLibraryPanel} pendingReference={!!route.ref} referenceError={routeError} onReferenceRetry={retryReference} /></div>
          )}
          <LazyView key={route.view} navigation={isLearning && (isMobile || collapsed) ? <>{sidebarButton}{newChatButton}</> : undefined}>
            {route.view === 'learning' && (
              <div className="view-host">
                {me.role === 'admin' ? <Learning navigation={<>{sidebarButton}{newChatButton}</>} /> : <p className="app-state" role="alert">Only admins can view student data.</p>}
              </div>
            )}
            {route.view === 'status' && <div className="view-host"><Status /></div>}
            {route.view === 'settings' && <div className="view-host"><Settings me={me} /></div>}
          </LazyView>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  useTheme()
  const [me, setMe] = useState<AuthMe | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const refreshMe = async () => {
    try {
      setMe(await getAuthMe())
    } catch {
      setMe(null)
    } finally {
      setAuthReady(true)
    }
  }

  useEffect(() => {
    let active = true
    getAuthMe()
      .then((user) => { if (active) setMe(user) })
      .catch(() => { if (active) setMe(null) })
      .finally(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      throw new Error(errorMessage(error, 'Sign out failed. Check your connection and try again.'), { cause: error })
    }
    resetConversation()
    resetSessions()
    setMe(null)
    setAuthReady(true)
  }

  if (!authReady) {
    return <div className="app-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Checking login status…</span></div>
  }

  if (!me) {
    return <Login onSuccess={refreshMe} />
  }

  return <Shell me={me} onLogout={handleLogout} />
}
