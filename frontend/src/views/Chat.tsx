import { useState, useRef, useEffect, useCallback } from 'react'
import { useSSE, type AgentStatusEvent, type DoneEvent, type SessionEvent } from '../hooks/useSSE'
import {
  deleteHistory,
  getAttachmentUrl,
  getHistory,
  getHistorySession,
  renameHistory,
  resolveWiki,
  type AttachmentRef,
  type MessageStatus,
  type SessionSummary,
  type StoredMessage,
} from '../api/client'
import MessageContent from '../components/MessageContent'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
  error?: string
  streaming?: boolean
  attachments?: AttachmentRef[]
}

type SessionListEntry = Pick<SessionSummary, 'session_id' | 'topic'>

const ACCEPTED_FILES = '.pdf,.docx,.png,.jpg,.jpeg,.pptx'

const isImage = (id: string) => /\.(png|jpg|jpeg)$/i.test(id)

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

// ── 头像图标（内联 SVG，颜色由 CSS 的 currentColor 控制）──────
const UserAvatarIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="11" r="5.2" fill="currentColor" />
    <path
      d="M16 18.4c-4.5 0-7.7 2.9-8.9 7.6-.2.9.6 1.6 1.5 1.6h14.8c.9 0 1.7-.7 1.5-1.6-1.2-4.7-4.4-7.6-8.9-7.6Z"
      fill="currentColor"
    />
  </svg>
)

const AssistantAvatarIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M16 5.5c1 5 2.6 6.6 7.5 7.5-4.9.9-6.5 2.5-7.5 7.5-1-5-2.6-6.6-7.5-7.5 4.9-.9 6.5-2.5 7.5-7.5Z"
      fill="currentColor"
    />
    <circle cx="24.5" cy="7" r="1.7" fill="currentColor" opacity="0.65" />
    <circle cx="7.5" cy="24.5" r="1.3" fill="currentColor" opacity="0.5" />
  </svg>
)

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<SessionListEntry[]>([])
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [topic, setTopic] = useState('新会话')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState('')
  const [referenceError, setReferenceError] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const shouldFollowRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  useEffect(() => {
    if (shouldFollowRef.current) bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

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

  // ── Auto-resize textarea ─────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  // ── SSE callbacks ────────────────────────────────────────────
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

  const onAttachments = useCallback((attachments: AttachmentRef[]) => {
    const msgId = pendingUserMsgIdRef.current
    if (!msgId) return
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, attachments } : m)))
  }, [])

  const { send, abort } = useSSE({ onSession, onChunk, onAgentStatus, onAttachments, onDone, onError })

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim() || (attachments.length ? '请分析我上传的附件。' : '')
    if (!text || loading) return
    const revision = ++viewRevisionRef.current

    const userMsg: Message = { id: uid(), role: 'user', content: text, status: 'completed' }
    const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', status: 'running', streaming: true }

    pendingUserMsgIdRef.current = userMsg.id
    activeAgentCallIdRef.current = null
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setAttachments([])
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
    attachments.forEach((file) => form.append('files', file, file.name))
    void send('/api/chat', { body: form })
  }, [attachments, input, loading, onError, send, sessionId])

  // ── Keyboard shortcut ────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    setAttachments((current) => [...current, ...selected].slice(0, 5))
    event.target.value = ''
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
                  <button key={q} className="empty-chip" onClick={() => void sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? <UserAvatarIcon /> : <AssistantAvatarIcon />}
              </div>
              <div className="message-body">
                <div className="message-bubble">
                    {msg.role === 'user' ? (
                      <>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="message-attachments">
                            {msg.attachments.map((att) => (
                              isImage(att.id) ? (
                                <a key={att.id} href={getAttachmentUrl(att.id)} target="_blank" rel="noreferrer">
                                  <img src={getAttachmentUrl(att.id)} alt={att.name} className="attachment-thumb" />
                                </a>
                              ) : (
                                <span key={att.id} className="attachment-chip">📎 {att.name}</span>
                              )
                            ))}
                          </div>
                        )}
                        {msg.content}
                      </>
                    ) : (
                      <>
                        {msg.streaming && !msg.content ? (
                          <span className="chat-thinking"><span /><span /><span /></span>
                        ) : (msg.content || (!msg.error && msg.status !== 'cancelled')) ? (
                          <MessageContent
                            content={msg.content || '…'}
                            streaming={msg.streaming}
                            onOpenRef={(title) => {
                              setReferenceError('')
                              resolveWiki(title)
                                .then((page) => {
                                  window.dispatchEvent(new CustomEvent('frankie-open-wiki', { detail: page }))
                                })
                                .catch((error: unknown) => {
                                  setReferenceError(error instanceof Error ? error.message : String(error))
                                })
                            }}
                          />
                        ) : null}
                        {msg.streaming && agentStatus && <span className="agent-status">{agentStatus}</span>}
                        {msg.error && <div className="agent-status" role="alert">⚠️ 错误：{msg.error}</div>}
                        {msg.status === 'cancelled' && <div className="agent-status">已停止生成</div>}
                      </>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((file, index) => (
              <div className="attachment-chip" key={`${file.name}-${index}`}>
                <span title={file.name}>📎 {file.name}</span>
                <button type="button" onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))} title="移除附件">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-input-row">
          <label className="chat-attach-btn" title="添加附件">
            <input type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} disabled={loading} />
            📎
          </label>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            placeholder="发送消息…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          {loading ? (
            <button className="chat-send-btn" onClick={handleStop} title="停止生成">
              ■
            </button>
          ) : (
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() && attachments.length === 0}
              title="发送 (Enter)"
            >
              ↑
            </button>
          )}
        </div>
        <div className="chat-hint">Enter 发送 · Shift+Enter 换行</div>
      </div>
    </div>
  )
}
