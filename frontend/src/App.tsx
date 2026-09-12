import { useEffect, useState } from 'react'
import Chat from './views/chat/Chat'
import Library from './views/library/Library'
import Status from './views/Status'
import Learning from './views/Learning'
import Settings from './views/Settings'
import Login from './views/Login'
import Icon from './components/Icon'
import Sidebar from './components/Sidebar'
import { getAuthMe, logout, type AuthMe } from './api/client'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMediaQuery } from './hooks/useMediaQuery'
import { newChat, resetConversation, useConversation } from './lib/conversation'
import { navigate, useRoute, type View } from './lib/router'
import { refreshSessions, resetSessions, useSessions } from './lib/sessions'

const VIEW_TITLES: Record<Exclude<View, 'chat'>, string> = {
  wiki: 'Wiki',
  lectures: '课件',
  learning: '学习情况',
  status: '状态',
  settings: '设置',
}

/** Sidebar, header and the active view. The chat stays mounted (hidden) so a streaming reply,
 * the scroll position and the composer draft survive visits to other views. */
function Shell({ me, onLogout }: { me: AuthMe; onLogout: () => void }) {
  const route = useRoute()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useLocalStorage('frankie.sidebar', false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sessions = useSessions()
  const conversation = useConversation()

  useEffect(() => {
    void refreshSessions()
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)
  const startNewChat = () => {
    newChat()
    navigate({ view: 'chat' })
    closeDrawer()
  }

  const title = route.view !== 'chat'
    ? VIEW_TITLES[route.view]
    : !route.session
      ? '新对话'
      : sessions?.find((session) => session.session_id === route.session)?.topic
        || (conversation.sessionId === route.session ? conversation.topic : '')

  const sidebarState = isMobile ? (drawerOpen ? ' is-open' : '') : (collapsed ? ' is-collapsed' : '')
  const isLearning = route.view === 'learning' && me.role === 'admin'
  const isLibrary = route.view === 'wiki' || route.view === 'lectures'
  const sidebarButton = (isMobile || collapsed) && (
    <button type="button" className="btn-icon" aria-label={isMobile ? '打开菜单' : '展开侧边栏'} onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(false))}>
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

      <div className="shell-main">
        {!isLearning && !isLibrary && <header className="shell-header">
          {sidebarButton}
          {!isMobile && newChatButton}
          <div className="shell-title">{title}</div>
          {isMobile && newChatButton}
        </header>}

        <div className="shell-body">
          <div className="view-host" hidden={route.view !== 'chat'}>
            <Chat me={me} />
          </div>
          {(route.view === 'wiki' || route.view === 'lectures') && (
            <div className="view-host"><Library kind={route.view} navigation={<>{sidebarButton}{newChatButton}</>} /></div>
          )}
          {route.view === 'learning' && (
            <div className="view-host">
              {me.role === 'admin' ? <Learning navigation={<>{sidebarButton}{newChatButton}</>} /> : <p className="app-state" role="alert">仅管理员可查看学习情况。</p>}
            </div>
          )}
          {route.view === 'status' && <div className="view-host"><Status /></div>}
          {route.view === 'settings' && <div className="view-host"><Settings me={me} /></div>}
        </div>
      </div>
    </div>
  )
}

export default function App() {
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
    } finally {
      resetConversation()
      resetSessions()
      setMe(null)
      setAuthReady(true)
    }
  }

  if (!authReady) {
    return <div className="app-state" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在校验登录状态…</span></div>
  }

  if (!me) {
    return <Login onSuccess={refreshMe} />
  }

  return <Shell me={me} onLogout={handleLogout} />
}
