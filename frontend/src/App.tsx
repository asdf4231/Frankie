import { useEffect, useState } from 'react'
import Chat from './views/Chat'
import FileLibrary from './views/FileLibrary'
import Status from './views/Status'
import Settings from './views/Settings'
import { AUTH_USER_KEY, AUTH_ADMIN_OVERRIDE_KEY, getAuthMe, type AuthMe } from './api/client'

type View = 'chat' | 'files' | 'status' | 'settings'

const NAV_ITEMS: { id: View; icon: string; label: string }[] = [
  { id: 'chat',     icon: '💬', label: 'Chat'   },
  { id: 'files',    icon: '📁', label: '文件库'  },
  { id: 'status',   icon: '📊', label: '状态'    },
  { id: 'settings', icon: '⚙️', label: '设置'    },
]

export default function App() {
  const [view, setView]           = useState<View>('chat')
  const [collapsed, setCollapsed] = useState(false)
  const [me, setMe]               = useState<AuthMe | null>(null)
  const [adminOverride, setAdminOverride] = useState<boolean>(() => {
    const value = localStorage.getItem(AUTH_ADMIN_OVERRIDE_KEY)
    return !!value && value !== '0' && value.toLowerCase() !== 'false'
  })

  useEffect(() => {
    getAuthMe().then(setMe).catch(() => { /* dev 默认账号兜底 */ })
  }, [])

  const toggleAdminOverride = () => {
    const enabled = !adminOverride
    setAdminOverride(enabled)
    if (enabled) {
      localStorage.setItem(AUTH_ADMIN_OVERRIDE_KEY, '1')
    } else {
      localStorage.removeItem(AUTH_ADMIN_OVERRIDE_KEY)
    }
    window.location.reload()
  }

  // 学生端隐藏系统设置入口（admin 专属）
  useEffect(() => {
    if (me && me.role !== 'admin' && view === 'settings') setView('chat')
  }, [me, view])

  const navItems = NAV_ITEMS.filter((i) => i.id !== 'settings' || me?.role === 'admin')

  return (
    <div className="app">
      {/* ── Sidebar ──────────────────────────────────── */}
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

        {/* ── 开发联调用的临时身份切换（上线后由学校统一认证替换）── */}
        {!collapsed && (
          <div className="dev-user-box" title="开发联调临时身份；学校统一认证接入后移除">
            <span className="dev-user-label">
              👤 {me ? `${me.display_name}${me.role === 'admin' ? '（管理员）' : ''}` : 'demo'}
            </span>
            <input
              className="dev-user-input"
              placeholder="输入学号切换身份"
              defaultValue={localStorage.getItem(AUTH_USER_KEY) ?? ''}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                localStorage.setItem(AUTH_USER_KEY, (e.target as HTMLInputElement).value.trim())
                window.location.reload()
              }}
            />
            <button
              className="dev-admin-toggle"
              type="button"
              onClick={toggleAdminOverride}
            >
              {adminOverride ? '关闭管理员测试模式' : '开启管理员测试模式'}
            </button>
            <div className="dev-admin-note">
              本地测试仅用：请求头 X-Frankie-Dev-Admin=1，启用后可访问管理员接口。
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <div className="main-content">
        {view === 'chat'     && <Chat />}
        {view === 'files'    && <FileLibrary />}
        {view === 'status'   && <Status />}
        {view === 'settings' && <Settings />}
      </div>

    </div>
  )
}
