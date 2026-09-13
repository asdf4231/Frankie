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
        {me.role === 'admin' && <span className="badge" translate="yes">Admin</span>}
        <Icon name="more-horizontal" size={16} />
      </button>
    )}>
      <MenuLink icon="settings" route={{ view: 'settings', sidebarSearch: route.sidebarSearch }} onNavigate={onNavigate}>Settings</MenuLink>
      <MenuSeparator />
      <div className="menu-label" aria-hidden="true">Appearance</div>
      <div role="group" aria-label="Appearance">
        <MenuItem icon="monitor" checked={theme === 'system'} keepOpen onSelect={() => setTheme('system')}>System</MenuItem>
        <MenuItem icon="sun" checked={theme === 'light'} keepOpen onSelect={() => setTheme('light')}>Light</MenuItem>
        <MenuItem icon="moon" checked={theme === 'dark'} keepOpen onSelect={() => setTheme('dark')}>Dark</MenuItem>
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
    catch (failure) { setError(errorMessage(failure, 'Sign out failed. Check your connection and try again.')); setArmed(false); setPending(false) }
  }
  return <>
    <MenuItem icon="log-out" danger keepOpen disabled={pending} onSelect={() => void select()}>
      {pending ? <><Icon name="loader" size={16} className="spin" />Signing out…</> : armed ? 'You have an unsent draft. Click again to sign out.' : 'Sign out'}
    </MenuItem>
    {error && <p className="menu-error" role="alert">{error}</p>}
  </>
}
