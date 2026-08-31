import { useState, useRef, useEffect, useCallback } from 'react'
import { useSSE } from '../hooks/useSSE'
import {
  authHeaders,
  deleteHistory,
  getAttachmentUrl,
  getAuthMe,
  getHistory,
  getHistorySession,
  renameHistory,
  saveHistory,
  type AttachmentRef,
  type SessionSummary,
  type StoredMessage,
} from '../api/client'
import MessageContent from '../components/MessageContent'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  archived?: boolean
  attachments?: AttachmentRef[]
}

const ACCEPTED_FILES = '.pdf,.docx,.png,.jpg,.jpeg,.pptx'

const isImage = (id: string) => /\.(png|jpg|jpeg)$/i.test(id)

type ToastType = 'archive' | 'archive-error'

interface ToastInfo {
  type: ToastType
  text?: string
  visible: boolean
}

let msgCounter = 0
const uid = () => `m${++msgCounter}`

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [topic, setTopic] = useState('新会话')
  const [isAdmin, setIsAdmin] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [toast, setToast] = useState<ToastInfo>({ type: 'archive', visible: false })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null) // message id being archived

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const shouldFollowRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingUserMsgIdRef = useRef<string | null>(null)

  // Restore the most recent SQLite-backed conversation after a page refresh.
  useEffect(() => {
    void getAuthMe().then((user) => setIsAdmin(user.role === 'admin')).catch(() => {})
    let active = true
    void getHistory()
      .then(async ({ sessions }) => {
        setSessions(sessions)
        const latest = sessions[0]
        if (!latest) return
        const result = await getHistorySession(latest.session_id)
        if (!active) return
        setSessionId(latest.session_id)
        setTopic(latest.topic || '新会话')
        setMessages(result.session.messages.map((message) => ({
          id: uid(),
          role: message.role,
          content: message.content,
          attachments: message.attachments,
        })))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // Persist each completed conversation so a refresh can restore it.
  useEffect(() => {
    if (messages.length === 0 || messages.some((message) => message.streaming)) return
    const history: StoredMessage[] = messages
      .filter((message) => message.content)
      .map(({ role, content, attachments }) => ({ role, content, attachments }))
    if (history.length === 0) return

    const timer = setTimeout(() => {
      const nextTopic = topic === '新会话' ? history.find((m) => m.role === 'user')?.content.slice(0, 24) || topic : topic
      void saveHistory(history, sessionId, nextTopic).then(({ session_id }) => {
        setSessionId(session_id)
        setTopic(nextTopic)
        void getHistory().then((result) => setSessions(result.sessions)).catch(() => {})
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [messages, sessionId, topic])

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
  const onChunk = useCallback((text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + text },
        ]
      }
      return prev
    })
  }, [])

  const onDone = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }]
      return prev
    })
    setLoading(false)
    setAgentStatus('')
  }, [])

  const onError = useCallback((err: Error) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + `\n\n⚠️ 错误：${err.message}`, streaming: false },
        ]
      }
      return prev
    })
    setLoading(false)
  }, [])

  const onAgentEvent = useCallback((event: Record<string, unknown>) => {
    const name = String(event.name ?? '')
    const query = String(event.query ?? '')
    const path = String(event.path ?? '')
    setAgentStatus(name === 'search_wiki' ? `正在检索：${query}` : name === 'read_wiki_page' ? `正在读取：${path}` : '正在查看 Wiki 目录')
  }, [])

  const onAttachments = useCallback((attachments: AttachmentRef[]) => {
    const msgId = pendingUserMsgIdRef.current
    if (!msgId) return
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, attachments } : m)))
  }, [])

  const { send, abort } = useSSE({ onChunk, onEvent: onAgentEvent, onAttachments, onDone, onError })

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim() || (attachments.length ? '请分析我上传的附件。' : '')
    if (!text || loading) return

    const userMsg: Message = { id: uid(), role: 'user', content: text }
    const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', streaming: true }

    // 构建历史（排除当前正在 streaming 的占位符）
    const history = messages
      .filter((m) => !m.streaming && m.content)
      .map((m) => ({ role: m.role, content: m.content, attachments: m.attachments }))

    pendingUserMsgIdRef.current = userMsg.id
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setAttachments([])
    setLoading(true)
    setAgentStatus('正在准备检索')

    const form = new FormData()
    form.append('message', text)
    form.append('history', JSON.stringify(history))
    attachments.forEach((file) => form.append('files', file, file.name))
    send('/api/chat', { body: form })
  }, [attachments, input, loading, messages, send])

  // ── Keyboard shortcut ────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Stop generation ──────────────────────────────────────────
  const handleStop = () => {
    abort()
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }]
      return prev
    })
    setLoading(false)
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    setAttachments((current) => [...current, ...selected].slice(0, 5))
    event.target.value = ''
  }

  const showToast = (info: Omit<ToastInfo, 'visible'>, duration = 2800) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ ...info, visible: true })
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }))
    }, duration)
  }

  const startNewSession = () => {
    if (loading) abort()
    setMessages([])
    setSessionId(undefined)
    setTopic('新会话')
    setLoading(false)
    setSessionPanelOpen(false)
  }

  const openSession = async (session: SessionSummary) => {
    if (loading) return
    const result = await getHistorySession(session.session_id)
    setSessionId(session.session_id)
    setTopic(session.topic || '新会话')
    setMessages(result.session.messages.map((message) => ({
      id: uid(), role: message.role, content: message.content, attachments: message.attachments,
    })))
    setSessionPanelOpen(false)
    shouldFollowRef.current = true
  }

  const editSessionTopic = async (session: SessionSummary) => {
    const next = window.prompt('会话名称', session.topic || '新会话')
    if (next === null || !next.trim()) return
    await renameHistory(session.session_id, next.trim())
    setSessions((prev) => prev.map((item) => item.session_id === session.session_id ? { ...item, topic: next.trim() } : item))
    if (session.session_id === sessionId) setTopic(next.trim())
  }

  const removeSession = async (session: SessionSummary) => {
    if (!window.confirm(`删除会话“${session.topic || '新会话'}”？`)) return
    await deleteHistory(session.session_id)
    const remaining = sessions.filter((item) => item.session_id !== session.session_id)
    setSessions(remaining)
    if (session.session_id === sessionId) startNewSession()
  }

  // ── Archive a single assistant message as insight ─────────────
  const archiveMessage = async (msg: Message, msgIndex: number) => {
    if (msg.archived || archiving === msg.id) return
    setArchiving(msg.id)

    // 构建归档所需历史：该条消息之前的所有消息 + 该条 assistant 消息
    const historyForSave = [
      ...messages
        .slice(0, msgIndex)
        .filter((m) => !m.streaming && m.content)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'assistant' as const, content: msg.content },
    ]

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ history: historyForSave }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // 标记该消息为已归档
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, archived: true } : m))
      )
      showToast({ type: 'archive', text: '洞见已归档到 insights/' }, 2500)
    } catch {
      showToast({ type: 'archive-error', text: '归档失败，请稍后重试' }, 2500)
    } finally {
      setArchiving(null)
    }
  }

  return (
    <div className="view">
      {toast.visible && (
        <div className={`mode-toast mode-toast--${toast.type}`}>
          <span className="mode-toast-icon">{toast.type === 'archive' ? '📥' : '⚠️'}</span>
          <div className="mode-toast-text">
            <strong>{toast.type === 'archive' ? '归档成功' : '归档失败'}</strong>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

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
          messages.map((msg, idx) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? 'U' : 'F'}
              </div>
              <div className="message-body">
                <div className={`message-bubble-wrap${msg.role === 'assistant' && !msg.streaming ? ' with-archive' : ''}`}>
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
                    ) : msg.streaming && !msg.content ? (
                      // 等待第一个 chunk：跳动三点动画
                      <>
                        <span className="chat-thinking"><span /><span /><span /></span>
                        {agentStatus && <span className="agent-status">{agentStatus}</span>}
                      </>
                    ) : (
                      // Assistant 消息：Markdown + Wiki 引用
                      <MessageContent
                        content={msg.content || (msg.streaming ? '' : '…')}
                        streaming={msg.streaming}
                        onOpenRef={(title) => {
                          fetch(`/api/wiki/resolve?title=${encodeURIComponent(title)}`, { headers: { ...authHeaders() } })
                            .then((r) => r.ok ? r.json() : null)
                            .then(async (d) => {
                              if (!d?.abs_path) return
                              window.dispatchEvent(new CustomEvent('frankie-open-wiki', { detail: d }))
                            })
                            .catch(() => {})
                        }}
                      />
                    )}
                  </div>
                  {/* 归档按钮：仅 assistant 非 streaming 消息显示 */}
                  {isAdmin && msg.role === 'assistant' && !msg.streaming && (
                    <button
                      className={`msg-archive-btn${msg.archived ? ' archived' : ''}${archiving === msg.id ? ' archiving' : ''}`}
                      onClick={() => archiveMessage(msg, idx)}
                      disabled={msg.archived || archiving === msg.id}
                      title={msg.archived ? '已归档为洞见' : '归档为洞见'}
                    >
                      {archiving === msg.id ? (
                        <span className="msg-archive-spinner" />
                      ) : msg.archived ? (
                        '✦'
                      ) : (
                        '⬡'
                      )}
                    </button>
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
