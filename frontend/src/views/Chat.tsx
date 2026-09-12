import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useSSE, type AgentStatusEvent, type DoneEvent, type SessionEvent } from '../hooks/useSSE'
import {
  deleteHistory,
  getHistory,
  getHistorySession,
  renameHistory,
  resolveWiki,
  type SessionSummary,
  type StoredMessage,
} from '../api/client'
import Composer from './chat/Composer'
import MessageItem, { type Message } from './chat/MessageItem'

type SessionListEntry = Pick<SessionSummary, 'session_id' | 'topic'>

let msgCounter = 0
const uid = () => `m${++msgCounter}`

const restoreMessage = (message: StoredMessage): Message => {
  const interrupted = message.role === 'assistant' && message.status === 'running'
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    attachments: message.attachments,
    status: interrupted ? 'failed' : message.status,
    error: message.error
      || (interrupted ? '回复因页面刷新或连接中断而中断。' : undefined)
      || (message.status === 'failed' ? '回复生成失败。' : undefined),
  }
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<SessionListEntry[]>([])
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [topic, setTopic] = useState('新会话')
  const [loading, setLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState('')
  const [referenceError, setReferenceError] = useState('')

  const messagesRef = useRef<HTMLDivElement>(null)
  const shouldFollowRef = useRef(true)
  const pendingUserMsgIdRef = useRef<string | null>(null)
  const activeAgentCallIdRef = useRef<string | null>(null)
  const viewRevisionRef = useRef(0)
  const cancelledSessionIdRef = useRef<string | undefined>(undefined)

  // Restore the most recent SQLite-backed conversation after a page refresh.
  useEffect(() => {
    let active = true
    const revision = viewRevisionRef.current
    void getHistory()
      .then(async ({ sessions }) => {
        if (!active || revision !== viewRevisionRef.current) return
        setSessions(sessions)
        const latest = sessions[0]
        if (!latest) return
        const result = await getHistorySession(latest.session_id)
        if (!active || revision !== viewRevisionRef.current) return
        setSessionId(result.session.session_id)
        setTopic(result.session.topic || '新会话')
        setMessages(result.session.messages.map(restoreMessage))
      })
      .catch(() => {})
    return () => {
      active = false
      viewRevisionRef.current += 1
    }
  }, [])

  // ── Auto-scroll ──────────────────────────────────────────────
  // Follow the bottom while the user stays near it; stop following once they scroll up.
  useEffect(() => {
    const container = messagesRef.current
    if (!container) return
    const updateFollowState = () => {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight
      shouldFollowRef.current = distance < 48
    }
    container.addEventListener('scroll', updateFollowState, { passive: true })
    updateFollowState()
    return () => container.removeEventListener('scroll', updateFollowState)
  }, [])

  const lastMessage = messages[messages.length - 1]
  const lastContentLength = lastMessage ? lastMessage.content.length : 0
  useLayoutEffect(() => {
    const container = messagesRef.current
    if (container && shouldFollowRef.current) container.scrollTop = container.scrollHeight
  }, [messages.length, lastContentLength])

  // ── SSE callbacks ───────────────���────────────────────────────
  const onSession = useCallback((event: SessionEvent) => {
    setSessionId(event.session_id)
    setTopic(event.topic || '新会话')
    setSessions((current) => [
      { session_id: event.session_id, topic: event.topic },
      ...current.filter((session) => session.session_id !== event.session_id),
    ])
  }, [])

  const onChunk = useCallback((text: string) => {
    setAgentStatus('')
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.streaming && last.status === 'running') {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + text },
        ]
      }
      return prev
    })
  }, [])

  const onDone = useCallback((event: DoneEvent) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') {
        const error = event.status === 'failed' ? last.error || '回复生成失败。' : last.error
        return [...prev.slice(0, -1), { ...last, error, status: event.status, streaming: false }]
      }
      return prev
    })
    pendingUserMsgIdRef.current = null
    activeAgentCallIdRef.current = null
    setLoading(false)
    setAgentStatus('')
    const revision = viewRevisionRef.current
    void getHistory().then((result) => {
      if (revision === viewRevisionRef.current) setSessions(result.sessions)
    }).catch(() => {})
  }, [])

  const onError = useCallback((err: Error) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.status === 'running') {
        return [
          ...prev.slice(0, -1),
          { ...last, error: err.message, status: 'failed', streaming: false },
        ]
      }
      return prev
    })
    pendingUserMsgIdRef.current = null
    activeAgentCallIdRef.current = null
    setLoading(false)
    setAgentStatus('')
  }, [])

  const onAgentStatus = useCallback((event: AgentStatusEvent) => {
    if (event.status === 'running') {
      activeAgentCallIdRef.current = event.call_id
      setAgentStatus(event.name === 'search_wiki'
        ? `正在检索：${event.query ?? ''}`
        : event.name === 'read_wiki_page'
          ? `正在读取：${event.path ?? ''}`
          : `正在执行：${event.name}`)
    } else if (activeAgentCallIdRef.current === event.call_id) {
      activeAgentCallIdRef.current = null
      setAgentStatus('')
    }
  }, [])

  const onAttachments = useCallback((attachments: Message['attachments']) => {
    const msgId = pendingUserMsgIdRef.current
    if (!msgId) return
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, attachments } : m)))
  }, [])

  const { send, abort } = useSSE({ onSession, onChunk, onAgentStatus, onAttachments, onDone, onError })

  // Stable across renders so memoised messages are not re-rendered by every Chat update.
  const openReference = useCallback((target: string) => {
    setReferenceError('')
    resolveWiki(target)
      .then((page) => {
        window.dispatchEvent(new CustomEvent('frankie-open-wiki', { detail: page }))
      })
      .catch((error: unknown) => {
        setReferenceError(error instanceof Error ? error.message : String(error))
      })
  }, [])

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, files: File[]) => {
    if (!text.trim() || loading) return
    const revision = ++viewRevisionRef.current
    shouldFollowRef.current = true

    const userMsg: Message = { id: uid(), role: 'user', content: text, status: 'completed' }
    const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', status: 'running', streaming: true }

    pendingUserMsgIdRef.current = userMsg.id
    activeAgentCallIdRef.current = null
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setLoading(true)
    setAgentStatus('正在准备检索')

    // Browser abort is not a server acknowledgement. Queue the next message
    // until the previous turn has actually released this session.
    if (sessionId && cancelledSessionIdRef.current === sessionId) {
      setAgentStatus('正在等待上一条回复停止')
      try {
        while (revision === viewRevisionRef.current) {
          const { session } = await getHistorySession(sessionId)
          if (revision !== viewRevisionRef.current) return
          if (!session.messages.some((message) => message.status === 'running')) {
            cancelledSessionIdRef.current = undefined
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (error) {
        if (revision === viewRevisionRef.current) onError(error as Error)
        return
      }
      if (revision !== viewRevisionRef.current) return
      setAgentStatus('正在准备检索')
    }

    const form = new FormData()
    form.append('message', text)
    if (sessionId) form.append('session_id', sessionId)
    files.forEach((file) => form.append('files', file, file.name))
    void send('/api/chat', { body: form })
  }, [loading, onError, send, sessionId])

  // ── Stop generation ──────────────────────────────────────────
  const handleStop = () => {
    viewRevisionRef.current += 1
    cancelledSessionIdRef.current = sessionId
    abort()
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.status === 'running') {
        return [...prev.slice(0, -1), { ...last, status: 'cancelled', streaming: false }]
      }
      return prev
    })
    pendingUserMsgIdRef.current = null
    activeAgentCallIdRef.current = null
    setLoading(false)
    setAgentStatus('')
  }

  const startNewSession = () => {
    setReferenceError('')
    viewRevisionRef.current += 1
    abort()
    pendingUserMsgIdRef.current = null
    activeAgentCallIdRef.current = null
    setMessages([])
    setSessionId(undefined)
    setTopic('新会话')
    setLoading(false)
    setAgentStatus('')
    setSessionPanelOpen(false)
  }

  const openSession = async (session: SessionListEntry) => {
    setReferenceError('')
    if (loading) return
    const revision = ++viewRevisionRef.current
    abort()
    pendingUserMsgIdRef.current = null
    activeAgentCallIdRef.current = null
    const result = await getHistorySession(session.session_id)
    if (revision !== viewRevisionRef.current) return
    setSessionId(result.session.session_id)
    setTopic(result.session.topic || '新会话')
    setMessages(result.session.messages.map(restoreMessage))
    setSessionPanelOpen(false)
    shouldFollowRef.current = true
  }

  const editSessionTopic = async (session: SessionListEntry) => {
    const next = window.prompt('会话名称', session.topic || '新会话')
    if (next === null || !next.trim()) return
    await renameHistory(session.session_id, next.trim())
    setSessions((prev) => prev.map((item) => item.session_id === session.session_id ? { ...item, topic: next.trim() } : item))
    if (session.session_id === sessionId) setTopic(next.trim())
  }

  const removeSession = async (session: SessionListEntry) => {
    if (!window.confirm(`删除会话“${session.topic || '新会话'}”？`)) return
    await deleteHistory(session.session_id)
    const remaining = sessions.filter((item) => item.session_id !== session.session_id)
    setSessions(remaining)
    if (session.session_id === sessionId) startNewSession()
  }

  return (
    <div className="view">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <button className="session-menu-btn" onClick={() => setSessionPanelOpen((open) => !open)} title="会话列表">☰</button>
          <h2>{topic}</h2>
        </div>
        <button className="new-session-btn" onClick={startNewSession}>＋ 新会话</button>
      </div>

      {sessionPanelOpen && (
        <div className="session-panel">
          <button className="session-new-item" onClick={startNewSession}>＋ 新建会话</button>
          {sessions.map((session) => (
            <div key={session.session_id} className={`session-item${session.session_id === sessionId ? ' active' : ''}`}>
              <button onClick={() => void openSession(session)}>{session.topic || '新会话'}</button>
              <button onClick={() => void editSessionTopic(session)} title="重命名">✎</button>
              <button onClick={() => void removeSession(session)} title="删除">×</button>
            </div>
          ))}
        </div>
      )}

      {referenceError && <div className="error-text" role="alert">无法打开引用：{referenceError}</div>}

      {/* Messages */}
      <div ref={messagesRef} className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-hero">
              <img className="empty-logo" src="/xmuc-logo.svg" alt="" />
              <div className="empty-title">厦门大学课程辅助系统</div>
              <div className="empty-sub">基于课件知识库的 AI 助教，试试这样问：</div>
              <div className="empty-suggestions">
                {[
                  '什么是 Bellman 方程？',
                  'Kuhn–Tucker 条件的直观理解',
                  '动态规划与最优控制有什么关系？',
                ].map((q) => (
                  <button key={q} className="empty-chip" onClick={() => void sendMessage(q, [])}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              agentStatus={msg.streaming ? agentStatus : ''}
              onOpenRef={openReference}
            />
          ))
        )}
      </div>

      <Composer busy={loading} onSend={(text, files) => void sendMessage(text, files)} onStop={handleStop} />
    </div>
  )
}
