import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import Icon from '../../components/Icon'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { isComposerDirty, setComposerDirty } from '../../lib/draft'

const ACCEPTED_FILES = '.pdf,.docx,.png,.jpg,.jpeg,.pptx'
const MAX_ATTACHMENTS = 5
const MAX_TEXTAREA_HEIGHT = 200
const NATIVE_SIZING = CSS.supports('field-sizing', 'content')

export interface ComposerHandle {
  focus(): void
  replaceDraft(text: string): void
}

interface Props {
  ref?: Ref<ComposerHandle>
  /** A reply is being generated: show the stop button and block sending, but keep the draft editable. */
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
  const usesTouchKeyboard = useMediaQuery('(hover: none), (pointer: coarse)')
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentNotice, setAttachmentNotice] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dirty = input.trim().length > 0 || attachments.length > 0
  useEffect(() => {
    setComposerDirty(dirty)
    if (!dirty) return
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (!isComposerDirty()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [dirty])
  useEffect(() => () => setComposerDirty(false), [])

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
      textareaRef.current?.focus({ preventScroll: true })
    },
    replaceDraft(text: string) {
      setInput(text)
      setAttachments([])
      setAttachmentNotice('')
      requestAnimationFrame(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        resize(textarea)
        textarea.focus({ preventScroll: true })
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      })
    },
  }), [])

  const canSend = !disabled && (input.trim().length > 0 || attachments.length > 0)

  const submit = () => {
    if (busy || !canSend) return
    onSend(input.trim() || 'Please analyze the attachments I uploaded.', attachments)
    setComposerDirty(false)
    setInput('')
    setAttachments([])
    setAttachmentNotice('')
    const textarea = textareaRef.current
    if (textarea && !NATIVE_SIZING) textarea.style.height = 'auto'
    textarea?.focus({ preventScroll: true })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME composition (isComposing, or keyCode 229 in older engines); never send then.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229 || usesTouchKeyboard) return
    event.preventDefault()
    submit()
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    const available = Math.max(0, MAX_ATTACHMENTS - attachments.length)
    const kept = selected.slice(0, available)
    const discarded = selected.length - kept.length
    setAttachments([...attachments, ...kept])
    setAttachmentNotice(discarded ? `You can add up to ${MAX_ATTACHMENTS} attachments; ${discarded} more ${discarded === 1 ? 'was' : 'were'} not added.` : '')
    event.target.value = ''
  }

  return (
    <div
      className="composer focus-field"
      onClick={(event) => {
        if ((event.target as Element).closest('button, input, textarea, a')) return
        textareaRef.current?.focus({ preventScroll: true })
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
                aria-label={`Remove attachment ${file.name}`}
                title="Remove attachment"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachmentNotice && <p className="composer-notice" role="alert">{attachmentNotice}</p>}
      <textarea
        ref={textareaRef}
        name="message"
        autoComplete="off"
        className="composer-textarea"
        rows={1}
        placeholder="Message Frankie…"
        aria-label="Message Frankie"
        title={usesTouchKeyboard ? 'Enter for a new line · Use the Send button to send' : 'Enter to send · Shift+Enter for a new line'}
        enterKeyHint={usesTouchKeyboard ? 'enter' : undefined}
        translate="no"
        value={input}
        onChange={(event) => {
          setInput(event.target.value)
          resize(event.target)
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-controls">
        <input ref={fileInputRef} name="attachments" type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} hidden />
        <button type="button" className="btn-icon btn-icon-round" aria-label="Add attachment" title="Add attachment" onClick={() => fileInputRef.current?.click()}>
          <Icon name="paperclip" />
        </button>
        {busy ? (
          <button type="button" className="btn-icon btn-icon-round btn-primary" onClick={onStop} aria-label="Stop generating" title="Stop generating">
            <Icon name="square" />
          </button>
        ) : (
          <button type="button" className="btn-icon btn-icon-round btn-primary" onClick={submit} disabled={!canSend} aria-label="Send message" title={usesTouchKeyboard ? 'Send message' : 'Send (Enter)'}>
            <Icon name="arrow-up" />
          </button>
        )}
      </div>
    </div>
  )
}
