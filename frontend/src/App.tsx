import { useEffect, useState } from 'react'
import Chat from './views/Chat'
import FileLibrary from './views/FileLibrary'
import Status from './views/Status'
import Learning from './views/Learning'
import Settings from './views/Settings'
import Icon from './components/Icon'
import Sidebar from './components/Sidebar'
import { getAuthMe, login, logout, type AuthMe } from './api/client'
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

function LoginScreen({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(userId.trim(), password)
      await onSuccess()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '登录失败'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src="/xmuc-logo.svg" alt="XMU" />
          <div className="login-brand-text">
            <h1>厦门大学课程辅助系统</h1>
            <p className="login-subtitle">Dynamic Optimization · Frankie AI 助教</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>学号 / 账号</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              placeholder="请输入学号或工号"
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? '登录中…' : '登 录'}
          </button>
        </form>
      </div>
      <p className="login-footer">厦门大学 · 动态优化课程 · Frankie</p>
    </div>
  )
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
        <header className="shell-header">
          {(isMobile || collapsed) && (
            <button
              type="button"
              className="btn-icon"
              aria-label={isMobile ? '打开菜单' : '展开侧边栏'}
              onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(false))}
            >
              <Icon name="panel-left" />
            </button>
          )}
          {!isMobile && collapsed && (
            <button type="button" className="btn-icon" aria-label="新对话" title="新对话" onClick={startNewChat}>
              <Icon name="square-pen" />
            </button>
          )}
          <div className="shell-title">{title}</div>
          {isMobile && (
            <button type="button" className="btn-icon" aria-label="新对话" onClick={startNewChat}>
              <Icon name="square-pen" />
            </button>
          )}
        </header>

        <div className="shell-body">
          <div className="view-host" hidden={route.view !== 'chat'}>
            <Chat />
          </div>
          {(route.view === 'wiki' || route.view === 'lectures') && (
            <div className="view-host"><FileLibrary /></div>
          )}
          {route.view === 'learning' && (
            <div className="view-host">
              {me.role === 'admin' ? <Learning /> : <p className="loading-text" role="alert">仅管理员可查看学习情况。</p>}
            </div>
          )}
          {route.view === 'status' && <div className="view-host"><Status /></div>}
          {route.view === 'settings' && <div className="view-host"><Settings /></div>}
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
    return <div className="loading-text">正在校验登录状态…</div>
  }

  if (!me) {
    return <LoginScreen onSuccess={refreshMe} />
  }

  return <Shell me={me} onLogout={handleLogout} />
}
