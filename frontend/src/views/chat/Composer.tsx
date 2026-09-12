import { useRef, useState } from 'react'

const ACCEPTED_FILES = '.pdf,.docx,.png,.jpg,.jpeg,.pptx'
const MAX_ATTACHMENTS = 5
const MAX_TEXTAREA_HEIGHT = 160

interface Props {
  /** A reply is being generated: show the stop button and ignore Enter, but keep the draft editable. */
  busy: boolean
  onSend: (text: string, files: File[]) => void
  onStop: () => void
}

const resize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
}

/** The composer owns its draft and attachments so keystrokes re-render only this component. */
export default function Composer({ busy, onSend, onStop }: Props) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = input.trim().length > 0 || attachments.length > 0

  const submit = () => {
    if (busy || !canSend) return
    onSend(input.trim() || '请分析我上传的附件。', attachments)
    setInput('')
    setAttachments([])
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = 'auto'
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME composition (isComposing, or keyCode 229 in older engines); never send then.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    submit()
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    setAttachments((current) => [...current, ...selected].slice(0, MAX_ATTACHMENTS))
    event.target.value = ''
  }

  return (
    <div className="chat-input-area">
      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((file, index) => (
            <div className="attachment-chip" key={`${file.name}-${index}`}>
              <span title={file.name}>📎 {file.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}
                title="移除附件"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="chat-input-row">
        <label className="chat-attach-btn" title="添加附件">
          <input type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} />
          📎
        </label>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          rows={1}
          placeholder="发送消息…"
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            resize(event.target)
          }}
          onKeyDown={handleKeyDown}
        />
        {busy ? (
          <button className="chat-send-btn" onClick={onStop} title="停止生成">
            ■
          </button>
        ) : (
          <button className="chat-send-btn" onClick={submit} disabled={!canSend} title="发送 (Enter)">
            ↑
          </button>
        )}
      </div>
      <div className="chat-hint">Enter 发送 · Shift+Enter 换行</div>
    </div>
  )
}
