import type { AuthMe } from '../api/client'
import { navigate } from '../lib/router'
import Icon from './Icon'
import Menu, { MenuItem, MenuSeparator } from './Menu'

interface Props {
  me: AuthMe
  onNavigate: () => void
  onLogout: () => void
}

export default function UserMenu({ me, onNavigate, onLogout }: Props) {
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
      <MenuItem icon="log-out" danger onSelect={onLogout}>退出登录</MenuItem>
    </Menu>
  )
}
