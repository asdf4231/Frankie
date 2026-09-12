import type { AuthMe } from '../api/client'
import { newChat } from '../lib/conversation'
import { navigate, type View } from '../lib/router'
import Icon, { type IconName } from './Icon'
import SessionList from './SessionList'
import UserMenu from './UserMenu'

const NAV_ITEMS: { id: View; icon: IconName; label: string; admin?: boolean }[] = [
  { id: 'wiki',     icon: 'book-open', label: 'Wiki' },
  { id: 'lectures', icon: 'file-text', label: '课件' },
  { id: 'learning', icon: 'bar-chart', label: '学习情况', admin: true },
  { id: 'status',   icon: 'activity',  label: '状态', admin: true },
]

interface Props {
  me: AuthMe
  activeView: View
  activeSession?: string
  /** Called after any navigation so the mobile drawer can close. */
  onNavigate: () => void
  /** Collapse (desktop) or close (mobile). */
  onCollapse: () => void
  onLogout: () => void
}

export default function Sidebar({ me, activeView, activeSession, onNavigate, onCollapse, onLogout }: Props) {
  const go = (view: View) => {
    navigate({ view })
    onNavigate()
  }
  const startNewChat = () => {
    newChat()
    navigate({ view: 'chat' })
    onNavigate()
  }

  return (
    <div className="sidebar-inner">
      <div className="sidebar-brand">
        <img src="/xmuc-logo.svg" alt="" />
        <span className="sidebar-brand-name">厦大课程助教</span>
        <button type="button" className="btn-icon" aria-label="收起侧边栏" onClick={onCollapse}>
          <Icon name="panel-left" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        <button type="button" className="list-item" onClick={startNewChat}>
          <Icon name="square-pen" size={18} />
          <span className="list-item-label">新对话</span>
        </button>
        {NAV_ITEMS.filter((item) => !item.admin || me.role === 'admin').map((item) => (
          <a
            key={item.id}
            className="list-item"
            href={`?view=${item.id}`}
            aria-current={activeView === item.id ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              go(item.id)
            }}
          >
            <Icon name={item.icon} size={18} />
            <span className="list-item-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <SessionList activeId={activeView === 'chat' ? activeSession : undefined} onNavigate={onNavigate} />

      <div className="sidebar-footer">
        <UserMenu me={me} onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </div>
  )
}
