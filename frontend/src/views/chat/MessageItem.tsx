import { memo } from 'react'
import { getAttachmentUrl } from '../../api/client'
import MessageContent from '../../components/MessageContent'
import type { Message } from '../../lib/conversation'

interface Props {
  message: Message
  /** Live tool progress; only the streaming message receives a non-empty value. */
  agentStatus: string
  onOpenRef: (target: string) => void
}

const isImage = (id: string) => /\.(png|jpg|jpeg)$/i.test(id)

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

/** One message. Memoised so a streaming update re-renders only the message that changed. */
function MessageItem({ message: msg, agentStatus, onOpenRef }: Props) {
  return (
    <div className={`message ${msg.role}`}>
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
                <MessageContent content={msg.content || '…'} streaming={msg.streaming} onOpenRef={onOpenRef} />
              ) : null}
              {msg.streaming && agentStatus && <span className="agent-status">{agentStatus}</span>}
              {msg.error && <div className="agent-status" role="alert">⚠️ 错误：{msg.error}</div>}
              {msg.status === 'cancelled' && <div className="agent-status">已停止生成</div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(MessageItem)
