import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getAttachmentUrl } from '../../api/client'
import MessageContent from '../../components/MessageContent'
import Icon from '../../components/Icon'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Message } from '../../lib/conversation'
import { resizeTextarea } from './textarea'

interface Props {
  message: Message
  /** Live tool progress; only the streaming message receives a non-empty value. */
  agentStatus: string
  /** A reply is being generated; user-message actions are hidden then. */
  busy: boolean
  onRegenerate: (message: Message) => void
  onEditedSend: (message: Message, text: string) => void
}

const isImage = (id: string) => /\.(png|jpg|jpeg)$/i.test(id)

function CopyButton({ content, label = 'Copy reply' }: { content: string; label?: string }) {
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
      <button type="button" className="btn-icon" onClick={() => void copy()} aria-label={status === 'copied' ? 'Copied' : label} title={status === 'copied' ? 'Copied' : label}>
        <Icon name={status === 'copied' ? 'check' : 'copy'} size={16} />
      </button>
      <span className="visually-hidden" role="status">{status === 'copied' ? 'Copied' : ''}</span>
      {status === 'failed' && <span className="chat-error" role="alert">Copy failed. Select the text and copy it manually.</span>}
    </span>
  )
}

/** A user question with copy / regenerate / edit actions, and the inline edit box. */
function UserMessage({ message, busy, onRegenerate, onEditedSend }: {
  message: Message
  busy: boolean
  onRegenerate: (message: Message) => void
  onEditedSend: (message: Message, text: string) => void
}) {
  const usesTouchKeyboard = useMediaQuery('(hover: none), (pointer: coarse)')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const startEdit = () => {
    setDraft(message.content)
    setEditing(true)
  }

  useLayoutEffect(() => {
    if (!editing) return
    const textarea = textareaRef.current
    if (!textarea) return
    resizeTextarea(textarea)
    textarea.focus({ preventScroll: true })
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [editing])

  const submit = () => {
    if (busy || !draft.trim()) return
    onEditedSend(message, draft)
    setEditing(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(false)
      return
    }
    // Enter confirms an IME composition (isComposing, or keyCode 229 in older engines); never send then.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229 || usesTouchKeyboard) return
    event.preventDefault()
    submit()
  }

  const attachments = !!message.attachments?.length && (
    <div className="message-attachments">
      {message.attachments.map((att) => (
        isImage(att.id) ? (
          <a key={att.id} href={getAttachmentUrl(att.id)} target="_blank" rel="noreferrer" aria-label={`Open image ${att.name}`}>
            <img src={getAttachmentUrl(att.id)} alt={att.name} className="message-thumbnail" width={240} height={180} loading="lazy" decoding="async" />
          </a>
        ) : (
          <a key={att.id} className="message-document" href={getAttachmentUrl(att.id)} target="_blank" rel="noreferrer" title={att.name}>
            <Icon name="file-text" size={16} /><span>{att.name}</span>
          </a>
        )
      ))}
    </div>
  )

  return editing ? (
    /* Editing reuses the composer surface: attachments above the input, round send button. */
    <div
      className="message-edit focus-field"
      onPointerDownCapture={(event) => {
        // Controls act without taking focus, so the on-screen keyboard stays open.
        if (event.button === 0 && document.activeElement === textareaRef.current && (event.target as Element).closest('button')) event.preventDefault()
      }}
      onClick={(event) => {
        const target = event.target as Element
        if (target.closest('.message-edit-controls, button, textarea, a')) return
        textareaRef.current?.focus({ preventScroll: true })
      }}
    >
      {attachments}
      <textarea
        ref={textareaRef}
        className="message-edit-textarea"
        rows={1}
        aria-label="Edit your question"
        title={usesTouchKeyboard ? 'Use the Send button to send' : 'Enter to send · Shift+Enter for a new line · Esc to cancel'}
        translate="no"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          resizeTextarea(event.target)
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="message-edit-controls">
        <button type="button" className="btn-icon btn-icon-round" onClick={() => setEditing(false)} aria-label="Cancel editing" title="Cancel editing">
          <Icon name="x" />
        </button>
        <button type="button" className="btn-icon btn-icon-round btn-primary" onClick={submit} disabled={busy || !draft.trim()} aria-label="Send question" title={usesTouchKeyboard ? 'Send question' : 'Send (Enter)'}>
          <Icon name="arrow-up" />
        </button>
      </div>
    </div>
  ) : (
    <>
      <div className="message-bubble">
        {attachments}
        <div className="message-user-text">{message.content}</div>
      </div>
      {!busy && (
        <div className="message-footer">
          <CopyButton content={message.content} label="Copy question" />
          <button type="button" className="btn-icon" onClick={() => onRegenerate(message)} aria-label="Regenerate answer" title="Regenerate answer">
            <Icon name="refresh" size={16} />
          </button>
          <button type="button" className="btn-icon" onClick={startEdit} aria-label="Edit question" title="Edit question">
            <Icon name="pencil" size={16} />
          </button>
        </div>
      )}
    </>
  )
}

/** One message. Memoised so a streaming update re-renders only the message that changed. */
function MessageItem({ message: msg, agentStatus, busy, onRegenerate, onEditedSend }: Props) {
  return (
    <article data-message-id={msg.id} className={`chat-message is-${msg.role}${msg.streaming ? ' is-streaming' : ''}`} aria-label={msg.role === 'user' ? 'Your message' : "Frankie's reply"}>
      {msg.role === 'user' ? (
        <UserMessage message={msg} busy={busy} onRegenerate={onRegenerate} onEditedSend={onEditedSend} />
      ) : (
        <>
          {msg.content && (
            <MessageContent content={msg.content} streaming={msg.streaming} actions={!msg.streaming && <CopyButton content={msg.content} />} />
          )}
          {msg.streaming && (!msg.content || agentStatus) && (
            <div className="message-progress" role="status">
              <span className="chat-thinking" aria-hidden="true"><span /><span /><span /></span>
              <span>{agentStatus || 'Thinking…'}</span>
            </div>
          )}
          {msg.error && <p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />Reply generation failed: {msg.error}</p>}
          {msg.status === 'cancelled' && <p className="message-cancelled">Generation stopped</p>}
        </>
      )}
    </article>
  )
}

export default memo(MessageItem)
