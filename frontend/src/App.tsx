import { lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Chat from './views/chat/Chat'
import Library from './views/library/Library'
import Login from './views/Login'
import Icon from './components/Icon'
import Sidebar from './components/Sidebar'
import LazyView from './components/LazyView'
import { errorMessage, getAuthMe, logout, type AuthMe } from './api/client'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { newChat, resetConversation, useConversation } from './lib/conversation'
import { isUnmodifiedPrimaryClick, navigate, useRoute, viewForRelPath, type View } from './lib/router'
import { resolveReferenceCached } from './lib/cache'
import { refreshSessions, resetSessions, useSessions } from './lib/sessions'

const Learning = lazy(() => import('./views/Learning'))
const Status = lazy(() => import('./views/Status'))
const Settings = lazy(() => import('./views/Settings'))
const DRAWER_FOCUSABLE = 'button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled), [tabindex="0"]'

const VIEW_TITLES: Record<Exclude<View, 'chat'>, string> = {
  wiki: 'Wiki',
  lectures: '课件',
  learning: '学习情况',
  status: '状态',
  settings: '设置',
}

/** Sidebar, header and the active view. The chat stays mounted (hidden) so a streaming reply,
 * the scroll position and the composer draft survive visits to other views. */
function Shell({ me, onLogout }: { me: AuthMe; onLogout: () => Promise<void> }) {
  const route = useRoute()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useLocalStorage('frankie.sidebar', false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [routeFailure, setRouteFailure] = useState({ key: '', message: '' })
  const [referenceRetry, setReferenceRetry] = useState(0)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerOpener = useRef<HTMLElement | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const sessions = useSessions()
  const conversation = useConversation()

  useEffect(() => {
    void refreshSessions()
  }, [])

  useEffect(() => {
    if (!route.ref) return
    let active = true
    resolveReferenceCached(route.ref, route.source)
      .then((page) => {
        if (!active) return
        const current = new URLSearchParams(window.location.search)
        if (current.get('ref') !== route.ref || (current.get('source') || undefined) !== route.source) return
        navigate({ ...route, view: viewForRelPath(page.rel_path), file: page.abs_path, ref: undefined, source: undefined }, { replace: true })
      })
      .catch((error: unknown) => {
        if (active) setRouteFailure({ key: `${route.ref}\n${route.source ?? ''}`, message: errorMessage(error, '无法打开这份课程资料，请检查链接或稍后重试。') })
      })
    return () => { active = false }
  }, [route, referenceRetry])

  useLayoutEffect(() => {
    if (!isMobile || !drawerOpen) return
    const opener = drawerOpener.current
    const main = mainRef.current
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawerOpen(false)
      } else if (event.key === 'Tab') {
        const items = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE) ?? [])
          .filter((item) => item.getClientRects().length > 0)
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
    }
    document.addEventListener('keydown', onKeyDown)
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const target = opener?.isConnected && opener.getClientRects().length
        ? opener
        : Array.from(main?.querySelectorAll<HTMLElement>('[data-sidebar-toggle]') ?? [])
          .find((button) => button.getClientRects().length > 0)
      target?.focus({ preventScroll: true })
    }
  }, [isMobile, drawerOpen])

  const routeError = route.ref && routeFailure.key === `${route.ref}\n${route.source ?? ''}` ? routeFailure.message : ''
  const closeDrawer = () => setDrawerOpen(false)
  const startNewChat = () => {
    newChat()
    navigate({ view: 'chat', sidebarSearch: route.sidebarSearch })
    closeDrawer()
  }

  const title = route.view !== 'chat'
    ? VIEW_TITLES[route.view]
    : !route.session
      ? '新对话'
      : sessions?.find((session) => session.session_id === route.session)?.topic
        || (conversation.sessionId === route.session ? conversation.topic : '')
        || '会话'

  const sidebarState = isMobile ? (drawerOpen ? ' is-open' : '') : (collapsed ? ' is-collapsed' : '')
  const isLearning = route.view === 'learning' && me.role === 'admin'
  const isLibrary = route.view === 'wiki' || route.view === 'lectures'
  const sidebarButton = (isMobile || collapsed) && (
    <button type="button" className="btn-icon" data-sidebar-toggle aria-label={isMobile ? '打开菜单' : '展开侧边栏'} onClick={(event) => {
      if (isMobile) {
        drawerOpener.current = event.currentTarget
        setDrawerOpen(true)
      } else setCollapsed(false)
    }}>
      <Icon name="panel-left" />
    </button>
  )
  const newChatButton = (isMobile || collapsed) && (
    <button type="button" className="btn-icon" aria-label="新对话" title="新对话" onClick={startNewChat}>
      <Icon name="square-pen" />
    </button>
  )

  return (
    <div className="shell">
      <a
        className="skip-link"
        href="#main-content"
        inert={isMobile && drawerOpen}
        aria-hidden={isMobile && drawerOpen ? true : undefined}
        tabIndex={isMobile && drawerOpen ? -1 : undefined}
        onClick={(event) => {
          if (!isUnmodifiedPrimaryClick(event)) return
          event.preventDefault()
          mainRef.current?.focus({ preventScroll: false })
        }}
      >跳到主要内容</a>
      <div
        ref={drawerRef}
        className="sidebar-region"
        role={isMobile && drawerOpen ? 'dialog' : undefined}
        aria-modal={isMobile && drawerOpen ? true : undefined}
        aria-label={isMobile && drawerOpen ? '主导航' : undefined}
        inert={isMobile ? !drawerOpen : collapsed}
      >
        <div className={`scrim${isMobile && drawerOpen ? ' is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />
        <aside className={`sidebar${sidebarState}`} aria-label="侧边栏">
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
          {routeError && <div className="route-error" role="alert"><Icon name="alert-circle" size={16} /><span>{routeError}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setReferenceRetry((value) => value + 1)}>重试</button></div>}
          <div className="view-host" hidden={route.view !== 'chat'}>
            <Chat me={me} />
          </div>
          {(route.view === 'wiki' || route.view === 'lectures') && (
            <div className="view-host"><Library kind={route.view} navigation={<>{sidebarButton}{newChatButton}</>} /></div>
          )}
          <LazyView key={route.view} navigation={isLearning && (isMobile || collapsed) ? <>{sidebarButton}{newChatButton}</> : undefined}>
            {route.view === 'learning' && (
              <div className="view-host">
                {me.role === 'admin' ? <Learning navigation={<>{sidebarButton}{newChatButton}</>} /> : <p className="app-state" role="alert">仅管理员可查看学习情况。</p>}
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
      throw new Error(errorMessage(error, '退出登录失败，请检查网络后重试。'), { cause: error })
    }
    resetConversation()
    resetSessions()
    setMe(null)
    setAuthReady(true)
  }

  if (!authReady) {
    return <div className="app-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在校验登录状态…</span></div>
  }

  if (!me) {
    return <Login onSuccess={refreshMe} />
  }

  return <Shell me={me} onLogout={handleLogout} />
}
