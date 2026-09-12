import { useEffect, useLayoutEffect, useRef } from 'react'
import { openReference, sendMessage, stopGeneration, syncRoute, useConversation } from '../lib/conversation'
import { useRoute } from '../lib/router'
import Composer, { type ComposerHandle } from './chat/Composer'
import MessageItem from './chat/MessageItem'

const SUGGESTIONS = [
  '什么是 Bellman 方程？',
  'Kuhn–Tucker 条件的直观理解',
  '动态规划与最优控制有什么关系？',
]

/** The chat view. Conversation state lives in `lib/conversation`; this component renders it,
 * keeps the URL and the store in step, and owns scrolling and the composer draft. */
export default function Chat() {
  const route = useRoute()
  const { messages, busy, agentStatus, sessionLoading, loadError, referenceError, focusRequest } = useConversation()
  const composerRef = useRef<ComposerHandle>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const shouldFollowRef = useRef(true)

  // Before paint, so a direct link to a session never flashes the empty state.
  useLayoutEffect(() => {
    syncRoute(route)
  }, [route])

  useEffect(() => {
    if (focusRequest > 0) composerRef.current?.focus()
  }, [focusRequest])

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
  }, [messages.length, lastContentLength, sessionLoading])

  const send = (text: string, files: File[]) => {
    shouldFollowRef.current = true
    void sendMessage(text, files)
  }

  return (
    <div className="view">
      {referenceError && <div className="error-text" role="alert">无法打开引用：{referenceError}</div>}
      {loadError && <div className="error-text" role="alert">无法加载会话：{loadError}</div>}

      <div ref={messagesRef} className="chat-messages">
        {sessionLoading ? (
          <div className="loading-text">加载中…</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-hero">
              <img className="empty-logo" src="/xmuc-logo.svg" alt="" />
              <div className="empty-title">厦门大学课程辅助系统</div>
              <div className="empty-sub">基于课件知识库的 AI 助教，试试这样问：</div>
              <div className="empty-suggestions">
                {SUGGESTIONS.map((question) => (
                  <button key={question} className="empty-chip" onClick={() => send(question, [])}>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              agentStatus={message.streaming ? agentStatus : ''}
              onOpenRef={openReference}
            />
          ))
        )}
      </div>

      <Composer ref={composerRef} busy={busy} disabled={sessionLoading} onSend={send} onStop={stopGeneration} />
    </div>
  )
}
