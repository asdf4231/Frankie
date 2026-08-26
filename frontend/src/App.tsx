import { useEffect, useState } from 'react'
import Chat from './views/Chat'
import FileLibrary from './views/FileLibrary'
import Status from './views/Status'
import Settings from './views/Settings'
import { getAuthMe, login, logout, type AuthMe } from './api/client'

type View = 'chat' | 'files' | 'status' | 'settings'

const NAV_ITEMS: { id: View; icon: string; label: string }[] = [
  { id: 'chat',     icon: '💬', label: 'Chat'   },
  { id: 'files',    icon: '📁', label: '文件库'  },
  { id: 'status',   icon: '📊', label: '状态'    },
  { id: 'settings', icon: '⚙️', label: '设置'    },
]

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
        <h1>Frankie 登录</h1>
        <p className="login-subtitle">请输入你的账号与密码</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>学号 / 账号</span>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} autoComplete="username" />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" disabled={submitting}>
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [collapsed, setCollapsed] = useState(false)
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
    void refreshMe()
  }, [])

  useEffect(() => {
    const openWiki = () => setView('files')
    window.addEventListener('frankie-open-wiki', openWiki)
    return () => window.removeEventListener('frankie-open-wiki', openWiki)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setMe(null)
      setAuthReady(true)
    }
  }

  const navItems = NAV_ITEMS.filter((item) => item.id !== 'status' || me?.role === 'admin')

  if (!authReady) {
    return <div className="loading-text">正在校验登录状态…</div>
  }

  if (!me) {
    return <LoginScreen onSuccess={refreshMe} />
  }

  return (
    <div className="app">
      <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand">
          {!collapsed && (
            <>
              <span className="brand-dot" />
              <span className="brand-name">厦大课程辅助</span>
            </>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${view === item.id ? ' active' : ''}${collapsed ? ' nav-item-icon-only' : ''}`}
              onClick={() => setView(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="dev-user-box" title="当前登录用户">
            <span className="dev-user-label">
              👤 {me.display_name}{me.role === 'admin' ? '（管理员）' : ''}
            </span>
            <button className="dev-admin-toggle" type="button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        )}
      </aside>

      <div className="main-content">
        {view === 'chat'     && <Chat />}
        {view === 'files'    && <FileLibrary />}
        {view === 'status'   && <Status />}
        {view === 'settings' && <Settings />}
      </div>
    </div>
  )
}
