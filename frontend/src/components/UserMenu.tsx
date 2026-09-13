import { useEffect, useState } from 'react'
import type { AuthMe } from '../api/client'
import { errorMessage } from '../api/client'
import { useTheme } from '../hooks/useTheme'
import { useRoute } from '../lib/router'
import { isComposerDirty } from '../lib/draft'
import Icon from './Icon'
import Menu, { MenuItem, MenuLink, MenuSeparator } from './Menu'

interface Props { me: AuthMe; onNavigate: () => void; onLogout: () => Promise<void> }

export default function UserMenu({ me, onNavigate, onLogout }: Props) {
  const [theme, setTheme] = useTheme()
  const route = useRoute()
  return (
    <Menu side="top" matchTriggerWidth renderTrigger={(props) => (
      <button {...props} type="button" className="user-button" title={me.user_id} translate="no">
        <span className="avatar" aria-hidden="true">{me.display_name.slice(0, 1).toUpperCase()}</span>
        <span className="user-name" translate="yes">{me.display_name}</span>
        {me.role === 'admin' && <span className="badge" translate="yes">管理员</span>}
        <Icon name="more-horizontal" size={16} />
      </button>
    )}>
      <MenuLink icon="settings" route={{ view: 'settings', sidebarSearch: route.sidebarSearch }} onNavigate={onNavigate}>设置</MenuLink>
      <MenuSeparator />
      <div className="menu-label" aria-hidden="true">外观</div>
      <div role="group" aria-label="外观">
        <MenuItem icon="monitor" checked={theme === 'system'} keepOpen onSelect={() => setTheme('system')}>跟随系统</MenuItem>
        <MenuItem icon="sun" checked={theme === 'light'} keepOpen onSelect={() => setTheme('light')}>浅色</MenuItem>
        <MenuItem icon="moon" checked={theme === 'dark'} keepOpen onSelect={() => setTheme('dark')}>深色</MenuItem>
      </div>
      <MenuSeparator />
      <LogoutItem onLogout={onLogout} />
    </Menu>
  )
}

function LogoutItem({ onLogout }: { onLogout: () => Promise<void> }) {
  const [armed, setArmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 5000)
    return () => clearTimeout(timer)
  }, [armed])
  const select = async () => {
    if (isComposerDirty() && !armed) { setArmed(true); setError(''); return }
    setPending(true); setError('')
    try { await onLogout() }
    catch (failure) { setError(errorMessage(failure, '退出登录失败，请检查网络后重试。')); setArmed(false); setPending(false) }
  }
  return <>
    <MenuItem icon="log-out" danger keepOpen disabled={pending} onSelect={() => void select()}>
      {pending ? <><Icon name="loader" size={16} className="spin" />正在退出…</> : armed ? '草稿未发送，再次点击退出' : '退出登录'}
    </MenuItem>
    {error && <p className="menu-error" role="alert">{error}</p>}
  </>
}
