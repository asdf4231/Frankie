import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import Icon from '../../components/Icon'

const ACCEPTED_FILES = '.pdf,.docx,.png,.jpg,.jpeg,.pptx'
const MAX_ATTACHMENTS = 5
const MAX_TEXTAREA_HEIGHT = 200
const NATIVE_SIZING = CSS.supports('field-sizing', 'content')

export interface ComposerHandle {
  focus(): void
}

interface Props {
  ref?: Ref<ComposerHandle>
  /** A reply is being generated: show the stop button and ignore Enter, but keep the draft editable. */
  busy: boolean
  /** Block sending (for example while a session is still loading) without touching the draft. */
  disabled?: boolean
  onSend: (text: string, files: File[]) => void
  onStop: () => void
}

const resize = (el: HTMLTextAreaElement) => {
  if (NATIVE_SIZING || !el.clientWidth) return
  el.style.height = '0px'
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
}

/** The composer owns its draft and attachments so keystrokes re-render only this component. */
export default function Composer({ ref, busy, disabled = false, onSend, onStop }: Props) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reflow the fallback when the sidebar, viewport or hidden view changes the available width.
  useEffect(() => {
    const textarea = textareaRef.current
    if (NATIVE_SIZING || !textarea) return
    let width = 0
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return
      width = textarea.clientWidth
      resize(textarea)
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [])

  useImperativeHandle(ref, () => ({
    focus() {
      textareaRef.current?.focus()
    },
  }), [])

  const canSend = !disabled && (input.trim().length > 0 || attachments.length > 0)

  const submit = () => {
    if (busy || !canSend) return
    onSend(input.trim() || '请分析我上传的附件。', attachments)
    setInput('')
    setAttachments([])
    const textarea = textareaRef.current
    if (textarea && !NATIVE_SIZING) textarea.style.height = 'auto'
    textarea?.focus()
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
    <div
      className="composer focus-field"
      onClick={(event) => {
        if ((event.target as Element).closest('button, input, textarea, a')) return
        textareaRef.current?.focus()
      }}
    >
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((file, index) => (
            <div className="composer-attachment" key={`${file.name}-${index}`}>
              <Icon name={/\.(png|jpe?g)$/i.test(file.name) ? 'image' : 'file-text'} size={16} />
              <span className="composer-attachment-name" title={file.name}>{file.name}</span>
              <button
                type="button"
                className="btn-icon btn-icon-sm"
                onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}
                aria-label={`移除附件 ${file.name}`}
                title="移除附件"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="composer-textarea"
        rows={1}
        placeholder="给 Frankie 发送消息…"
        aria-label="给 Frankie 发送消息"
        title="Enter 发送 · Shift+Enter 换行"
        value={input}
        onChange={(event) => {
          setInput(event.target.value)
          resize(event.target)
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-controls">
        <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} hidden />
        <button type="button" className="btn-icon btn-icon-round" aria-label="添加附件" title="添加附件" onClick={() => fileInputRef.current?.click()}>
          <Icon name="paperclip" />
        </button>
        {busy ? (
          <button type="button" className="btn-icon btn-icon-round btn-primary" onClick={onStop} aria-label="停止生成" title="停止生成">
            <Icon name="square" />
          </button>
        ) : (
          <button type="button" className="btn-icon btn-icon-round btn-primary" onClick={submit} disabled={!canSend} aria-label="发送消息" title="发送 (Enter)">
            <Icon name="arrow-up" />
          </button>
        )}
      </div>
    </div>
  )
}
