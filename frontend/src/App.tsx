import { useEffect, useState } from 'react'
import Chat from './views/Chat'
import FileLibrary from './views/FileLibrary'
import Status from './views/Status'
import Learning from './views/Learning'
import Settings from './views/Settings'
import Icon, { type IconName } from './components/Icon'
import { getAuthMe, login, logout, type AuthMe } from './api/client'
import { navigate, useRoute, type View } from './lib/router'

const NAV_ITEMS: { id: View; icon: IconName; label: string }[] = [
  { id: 'chat',     icon: 'message-square', label: 'Chat'     },
  { id: 'wiki',     icon: 'book-open',      label: 'Wiki'     },
  { id: 'lectures', icon: 'file-text',      label: '课件'     },
  { id: 'learning', icon: 'bar-chart',      label: '学习情况' },
  { id: 'status',   icon: 'activity',       label: '状态'     },
  { id: 'settings', icon: 'settings',       label: '设置'     },
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

export default function App() {
  const { view } = useRoute()
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
      setMe(null)
      setAuthReady(true)
    }
  }

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'status' || item.id === 'learning') return me?.role === 'admin'
    return true
  })

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
              <img className="brand-logo" src="/xmuc-logo.svg" alt="" />
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
              onClick={() => navigate({ view: item.id })}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="dev-user-box" title="当前登录用户">
            <span className="dev-user-label">
              {me.display_name}{me.role === 'admin' ? '（管理员）' : ''}
            </span>
            <button className="dev-admin-toggle" type="button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        )}
      </aside>

      <div className="main-content">
        {view === 'chat' && <Chat />}
        {(view === 'wiki' || view === 'lectures') && <FileLibrary />}
        {view === 'learning' && (me.role === 'admin' ? <Learning /> : <p role="alert">仅管理员可查看学习情况。</p>)}
        {view === 'status' && <Status />}
        {view === 'settings' && <Settings />}
      </div>

      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item${view === item.id ? ' active' : ''}`}
            onClick={() => navigate({ view: item.id })}
            title={item.label}
          >
            <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
