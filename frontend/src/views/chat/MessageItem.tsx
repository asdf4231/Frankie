import { memo, useEffect, useRef, useState } from 'react'
import { getAttachmentUrl } from '../../api/client'
import MessageContent from '../../components/MessageContent'
import Icon from '../../components/Icon'
import type { Message } from '../../lib/conversation'

interface Props {
  message: Message
  /** Live tool progress; only the streaming message receives a non-empty value. */
  agentStatus: string
  onOpenRef: (target: string) => void
}

const isImage = (id: string) => /\.(png|jpg|jpeg)$/i.test(id)

function CopyButton({ content }: { content: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(content)
      setStatus('copied')
      timer.current = setTimeout(() => setStatus('idle'), 1500)
    } catch {
      setStatus('failed')
    }
  }

  return (
    <span className="message-copy">
      <button type="button" className="btn-icon" onClick={() => void copy()} aria-label={status === 'copied' ? '已复制' : '复制回答'} title={status === 'copied' ? '已复制' : '复制回答'}>
        <Icon name={status === 'copied' ? 'check' : 'copy'} size={16} />
      </button>
      <span className="visually-hidden" role="status">{status === 'copied' ? '已复制' : ''}</span>
      {status === 'failed' && <span className="chat-error" role="alert">复制失败，请手动选择文字复制</span>}
    </span>
  )
}

/** One message. Memoised so a streaming update re-renders only the message that changed. */
function MessageItem({ message: msg, agentStatus, onOpenRef }: Props) {
  return (
    <article className={`chat-message is-${msg.role}`} aria-label={msg.role === 'user' ? '你的消息' : 'Frankie 的回答'}>
      {msg.role === 'user' ? (
        <>
          {!!msg.attachments?.length && (
            <div className="message-attachments">
              {msg.attachments.map((att) => (
                isImage(att.id) ? (
                  <a key={att.id} href={getAttachmentUrl(att.id)} target="_blank" rel="noreferrer" aria-label={`打开图片 ${att.name}`}>
                    <img src={getAttachmentUrl(att.id)} alt={att.name} className="message-thumbnail" />
                  </a>
                ) : (
                  <a key={att.id} className="message-document" href={getAttachmentUrl(att.id)} target="_blank" rel="noreferrer" title={att.name}>
                    <Icon name="file-text" size={16} /><span>{att.name}</span>
                  </a>
                )
              ))}
            </div>
          )}
          <div className="message-user-text">{msg.content}</div>
        </>
      ) : (
        <>
          {msg.content && (
            <MessageContent content={msg.content} streaming={msg.streaming} onOpenRef={onOpenRef} actions={!msg.streaming && <CopyButton content={msg.content} />} />
          )}
          {msg.streaming && (!msg.content || agentStatus) && (
            <div className="message-progress" role="status">
              <span className="chat-thinking" aria-hidden="true"><span /><span /><span /></span>
              <span>{agentStatus || '正在思考…'}</span>
            </div>
          )}
          {msg.error && <p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />回复生成失败：{msg.error}</p>}
          {msg.status === 'cancelled' && <p className="message-cancelled">已停止生成</p>}
        </>
      )}
    </article>
  )
}

export default memo(MessageItem)
