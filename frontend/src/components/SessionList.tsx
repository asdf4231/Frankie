import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { errorMessage, type SessionSummary } from '../api/client'
import { getConversation, newChat } from '../lib/conversation'
import { formatCount, groupByDate } from '../lib/dates'
import { followRoute, navigate, routeHref, useRoute } from '../lib/router'
import { refreshSessions, removeSession, renameSession, useSessions, useSessionsError } from '../lib/sessions'
import Icon from './Icon'
import Menu, { MenuItem } from './Menu'

const SEARCH_THRESHOLD = 15
const sessionTitle = (session: SessionSummary) => session.topic || 'New chat'

interface Props { activeId?: string; onNavigate: () => void }

export default function SessionList({ activeId, onNavigate }: Props) {
  const route = useRoute()
  const sessions = useSessions()
  const historyError = useSessionsError()
  const filter = route.sidebarSearch ?? ''
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const deferredFilter = useDeferredValue(filter)
  const cancelledRef = useRef(false)
  const returnFocusId = useRef<string | null>(null)
  const renameInput = useRef<HTMLInputElement>(null)
  const savePending = useRef(false)

  const filtered = useMemo(() => {
    if (!sessions) return []
    const query = deferredFilter.trim().toLocaleLowerCase()
    return query ? sessions.filter((session) => sessionTitle(session).toLocaleLowerCase().includes(query)) : sessions
  }, [sessions, deferredFilter])
  const groups = useMemo(() => groupByDate(filtered), [filtered])
  const setFilter = (value: string) => navigate({ ...route, sidebarSearch: value || undefined }, { replace: true })

  useEffect(() => {
    if (!editingId && returnFocusId.current) {
      const target = document.querySelector<HTMLAnchorElement>(`[data-session-id="${CSS.escape(returnFocusId.current)}"]`)
        ?? document.querySelector<HTMLInputElement>('[name="history-search"]')
      target?.focus({ preventScroll: true })
      returnFocusId.current = null
    }
  }, [editingId])

  const startRename = (session: SessionSummary) => {
    if (savePending.current) return
    cancelledRef.current = false
    returnFocusId.current = null
    setActionError('')
    setDraft(sessionTitle(session))
    setEditingId(session.session_id)
  }
  const cancelRename = (sessionId: string) => {
    if (savePending.current) return
    cancelledRef.current = true
    returnFocusId.current = sessionId
    setEditingId(null)
    setActionError('')
  }
  const commitRename = async (session: SessionSummary, restoreFocus = false) => {
    if (savePending.current) return
    const topic = draft.trim()
    if (!topic || topic === sessionTitle(session)) {
      returnFocusId.current = restoreFocus ? session.session_id : null
      setEditingId(null)
      return
    }
    const editor = renameInput.current
    savePending.current = true
    setSaving(true)
    setActionError('')
    try {
      await renameSession(session.session_id, topic)
      // A blur-triggered save must not pull focus back from the user's next destination.
      returnFocusId.current = restoreFocus && document.activeElement === editor ? session.session_id : null
      setEditingId(null)
    } catch (error) {
      setActionError(errorMessage(error, 'Rename failed. Check your connection and press Enter to try again.'))
    } finally {
      savePending.current = false
      setSaving(false)
    }
  }

  const remove = async (session: SessionSummary) => {
    if (savePending.current) return
    setActionError('')
    try { await removeSession(session.session_id) }
    catch (error) { setActionError(errorMessage(error, 'Delete failed. Check your connection and try again.')); return }
    if (getConversation().sessionId === session.session_id) {
      newChat()
      if (activeId === session.session_id) navigate({ view: 'chat', sidebarSearch: route.sidebarSearch })
    }
  }

  return (
    <div className="sidebar-sessions">
      {sessions && (sessions.length > SEARCH_THRESHOLD || filter) && (
        <label className="search sidebar-search focus-field">
          <Icon name="search" size={16} />
          <input name="history-search" autoComplete="off" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search conversations, e.g. Bellman…" aria-label="Search conversations" />
          {filter && <button type="button" className="btn-icon btn-icon-sm" aria-label="Clear search" onClick={() => setFilter('')}><Icon name="x" size={14} /></button>}
        </label>
      )}
      <span className="visually-hidden" role="status">{filter ? `${formatCount(filtered.length, 'conversation')} found` : ''}</span>
      <span className="visually-hidden" role="status">{saving ? 'Saving conversation name…' : ''}</span>
      {historyError && <div className="sidebar-local-error" role="alert"><span>{historyError}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => void refreshSessions()}>Retry</button></div>}
      {actionError && <p id="session-action-error" className="sidebar-local-error" role="alert">{actionError}</p>}
      {sessions?.length === 0 && <p className="sidebar-note">No conversations yet</p>}
      {sessions && sessions.length > 0 && filtered.length === 0 && <p className="sidebar-note">No matching conversations</p>}

      {groups.map((group) => <div key={group.label} className="content-list-group">
        <div className="group-label">{group.label}</div>
        {group.items.map((session) => {
          const active = session.session_id === activeId
          const editing = session.session_id === editingId
          const destination = { view: 'chat' as const, session: session.session_id, sidebarSearch: route.sidebarSearch }
          return <div key={session.session_id} className={`list-item session-row content-auto${active ? ' is-active' : ''}`}>
            {editing ? <><input
              ref={renameInput} className="session-rename" name="session-name" autoComplete="off" value={draft} autoFocus readOnly={saving} aria-busy={saving} aria-label="Conversation name"
              aria-invalid={!!actionError} aria-describedby={actionError ? 'session-action-error' : undefined}
              onFocus={(event) => event.target.select()} onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return
                if (event.key === 'Enter') { event.preventDefault(); void commitRename(session, true) }
                else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelRename(session.session_id) }
              }}
              onBlur={() => { if (cancelledRef.current) cancelledRef.current = false; else void commitRename(session) }}
            />{saving && <Icon name="loader" size={16} className="spin" />}</> : <>
              <a data-session-id={session.session_id} className="session-link" href={routeHref(destination)} aria-current={active ? 'page' : undefined} title={sessionTitle(session)} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onNavigate(); followRoute(event, destination) }}>{sessionTitle(session)}</a>
              <Menu align="end" renderTrigger={(props) => <button {...props} type="button" className="btn-icon btn-icon-sm list-item-action" aria-label="Conversation actions"><Icon name="more-horizontal" size={16} /></button>}>
                <MenuItem icon="pencil" disabled={saving} onSelect={() => startRename(session)}>Rename</MenuItem>
                <DeleteItem disabled={saving} onConfirm={() => void remove(session)} />
              </Menu>
            </>}
          </div>
        })}
      </div>)}
    </div>
  )
}

function DeleteItem({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (armed) { const timer = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(timer) } }, [armed])
  return <MenuItem icon="trash" danger disabled={disabled} keepOpen={!armed} onSelect={() => armed ? onConfirm() : setArmed(true)}>{armed ? 'Confirm delete' : 'Delete'}</MenuItem>
}
