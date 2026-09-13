import type { AuthMe } from '../api/client'
import { navigate } from '../lib/router'
import { useTheme } from '../hooks/useTheme'
import Icon from './Icon'
import Menu, { MenuItem, MenuSeparator } from './Menu'

interface Props {
  me: AuthMe
  onNavigate: () => void
  onLogout: () => void
}

export default function UserMenu({ me, onNavigate, onLogout }: Props) {
  const [theme, setTheme] = useTheme()

  return (
    <Menu
      side="top"
      matchTriggerWidth
      renderTrigger={(props) => (
        <button {...props} type="button" className="user-button" title={me.user_id}>
          <span className="avatar" aria-hidden="true">{me.display_name.slice(0, 1).toUpperCase()}</span>
          <span className="user-name">{me.display_name}</span>
          {me.role === 'admin' && <span className="badge">管理员</span>}
          <Icon name="more-horizontal" size={16} />
        </button>
      )}
    >
      <MenuItem icon="settings" onSelect={() => { navigate({ view: 'settings' }); onNavigate() }}>设置</MenuItem>
      <MenuSeparator />
      <div className="menu-label" aria-hidden="true">外观</div>
      <div role="group" aria-label="外观">
        <MenuItem icon="monitor" checked={theme === 'system'} keepOpen onSelect={() => setTheme('system')}>跟随系统</MenuItem>
        <MenuItem icon="sun" checked={theme === 'light'} keepOpen onSelect={() => setTheme('light')}>浅色</MenuItem>
        <MenuItem icon="moon" checked={theme === 'dark'} keepOpen onSelect={() => setTheme('dark')}>深色</MenuItem>
      </div>
      <MenuSeparator />
      <MenuItem icon="log-out" danger onSelect={onLogout}>退出登录</MenuItem>
    </Menu>
  )
}
