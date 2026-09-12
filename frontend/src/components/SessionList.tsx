import { useEffect, useMemo, useRef, useState } from 'react'
import type { SessionSummary } from '../api/client'
import { getConversation, newChat } from '../lib/conversation'
import { groupByDate } from '../lib/dates'
import { navigate } from '../lib/router'
import { removeSession, renameSession, useSessions } from '../lib/sessions'
import Icon from './Icon'
import Menu, { MenuItem } from './Menu'

const SEARCH_THRESHOLD = 15
const sessionTitle = (session: SessionSummary) => session.topic || '新会话'

interface Props {
  /** Session shown in the chat view, if the chat view is open. */
  activeId?: string
  /** Called after any navigation so the mobile drawer can close. */
  onNavigate: () => void
}

/** Chat history grouped by day, with inline rename and two-step delete. */
export default function SessionList({ activeId, onNavigate }: Props) {
  const sessions = useSessions()
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const cancelledRef = useRef(false)

  const filtered = useMemo(() => {
    if (!sessions) return []
    const query = filter.trim().toLowerCase()
    return query ? sessions.filter((session) => sessionTitle(session).toLowerCase().includes(query)) : sessions
  }, [sessions, filter])
  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const open = (session: SessionSummary) => {
    navigate({ view: 'chat', session: session.session_id })
    onNavigate()
  }

  const startRename = (session: SessionSummary) => {
    cancelledRef.current = false
    setDraft(sessionTitle(session))
    setEditingId(session.session_id)
  }

  const commitRename = (session: SessionSummary) => {
    setEditingId(null)
    const topic = draft.trim()
    if (!topic || topic === sessionTitle(session)) return
    renameSession(session.session_id, topic).catch(() => {})
  }

  const remove = async (session: SessionSummary) => {
    try {
      await removeSession(session.session_id)
    } catch {
      return
    }
    if (getConversation().sessionId === session.session_id) {
      newChat()
      if (activeId === session.session_id) navigate({ view: 'chat' })
    }
  }

  return (
    <div className="sidebar-sessions">
      {sessions && sessions.length > SEARCH_THRESHOLD && (
        <label className="search sidebar-search focus-field">
          <Icon name="search" size={16} />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="搜索对话" aria-label="搜索对话" />
          {filter && (
            <button type="button" className="btn-icon btn-icon-sm" aria-label="清空搜索" onClick={() => setFilter('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </label>
      )}

      {sessions?.length === 0 && <p className="sidebar-note">还没有对话记录</p>}
      {sessions && sessions.length > 0 && filtered.length === 0 && <p className="sidebar-note">没有匹配的对话</p>}

      {groups.map((group) => (
        <div key={group.label}>
          <div className="group-label">{group.label}</div>
          {group.items.map((session) => {
            const active = session.session_id === activeId
            const editing = session.session_id === editingId
            return (
              <div key={session.session_id} className={`list-item session-row${active ? ' is-active' : ''}`}>
                {editing ? (
                  <input
                    className="session-rename"
                    value={draft}
                    autoFocus
                    aria-label="会话名称"
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.nativeEvent.isComposing) return
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        event.currentTarget.blur()
                      } else if (event.key === 'Escape') {
                        cancelledRef.current = true
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => {
                      if (cancelledRef.current) {
                        cancelledRef.current = false
                        return
                      }
                      commitRename(session)
                    }}
                  />
                ) : (
                  <>
                    <a
                      className="session-link"
                      href={`?view=chat&session=${encodeURIComponent(session.session_id)}`}
                      aria-current={active ? 'page' : undefined}
                      title={sessionTitle(session)}
                      onClick={(event) => {
                        event.preventDefault()
                        open(session)
                      }}
                    >
                      {sessionTitle(session)}
                    </a>
                    <Menu
                      align="end"
                      renderTrigger={(props) => (
                        <button {...props} type="button" className="btn-icon btn-icon-sm list-item-action" aria-label="会话操作">
                          <Icon name="more-horizontal" size={16} />
                        </button>
                      )}
                    >
                      <MenuItem icon="pencil" onSelect={() => startRename(session)}>重命名</MenuItem>
                      <DeleteItem onConfirm={() => void remove(session)} />
                    </Menu>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** "删除" arms for three seconds and becomes "确认删除"; the second click deletes. */
function DeleteItem({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])
  return (
    <MenuItem icon="trash" danger keepOpen={!armed} onSelect={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? '确认删除' : '删除'}
    </MenuItem>
  )
}
