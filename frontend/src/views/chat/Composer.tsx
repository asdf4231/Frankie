import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import type { ThinkingLevel } from '../../api/client'
import Icon from '../../components/Icon'
import Menu, { MenuItem } from '../../components/Menu'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { isComposerDirty, setComposerDirty } from '../../lib/draft'
import { isImageFile, shrinkImage } from '../../lib/images'
import { NATIVE_SIZING, resizeTextarea } from './textarea'

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.png', '.jpg', '.jpeg']
const ACCEPTED_FILES = ACCEPTED_EXTENSIONS.join(',')
const ACCEPTED_LABEL = 'PDF, DOCX, PPTX, PNG, JPG'
const MAX_ATTACHMENTS = 5
/** The server limit (attachments.py), applied to the file as picked, before an image shrinks. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

const isAccepted = (file: File) => ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))

const THINKING_OPTIONS: { value: ThinkingLevel; label: string; note: string }[] = [
  { value: 'off', label: 'Standard', note: 'Fastest, no reasoning' },
  { value: 'low', label: 'Think · Low', note: 'Light reasoning' },
  { value: 'high', label: 'Think · High', note: 'Deeper reasoning' },
  { value: 'max', label: 'Think · Max', note: 'Hardest problems' },
]

export interface ComposerHandle {
  focus(): void
  replaceDraft(text: string): void
  /** Attach files from outside the composer (drag and drop); unsupported and surplus files are reported inline. */
  addFiles(files: File[]): void
}

interface Props {
  ref?: Ref<ComposerHandle>
  thinking: ThinkingLevel
  /** Levels this account may pick; a stored level outside the list shows as the strongest available one. */
  thinkingLevels: ThinkingLevel[]
  /** A reply is being generated: show the stop button and block sending, but keep the draft editable. */
  busy: boolean
  /** Block sending (for example while a session is still loading) without touching the draft. */
  disabled?: boolean
  /** Files are being dragged over the chat: show the composer as the landing spot. */
  dropActive?: boolean
  onThinkingChange: (thinking: ThinkingLevel) => void
  onSend: (text: string, files: File[]) => void
  onStop: () => void
}

/** The composer owns its draft and attachments so keystrokes re-render only this component. */
export default function Composer({ ref, thinking, thinkingLevels, busy, disabled = false, dropActive = false, onThinkingChange, onSend, onStop }: Props) {
  const usesTouchKeyboard = useMediaQuery('(hover: none), (pointer: coarse)')
  const thinkingOptions = THINKING_OPTIONS.filter((option) => thinkingLevels.includes(option.value))
  const currentThinking = thinkingOptions.find((option) => option.value === thinking) ?? thinkingOptions[thinkingOptions.length - 1] ?? THINKING_OPTIONS[0]
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
      resizeTextarea(textarea)
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const supported = files.filter(isAccepted)
    const rejected = files.length - supported.length
    const fitting = supported.filter((file) => file.size <= MAX_ATTACHMENT_BYTES)
    const oversized = supported.length - fitting.length
    const kept = fitting.slice(0, Math.max(0, MAX_ATTACHMENTS - attachments.length))
    const discarded = fitting.length - kept.length
    const notices = []
    if (rejected) notices.push(`${rejected === 1 ? 'One file was' : `${rejected} files were`} not added: only ${ACCEPTED_LABEL} are supported.`)
    if (oversized) notices.push(`${oversized === 1 ? 'One file was' : `${oversized} files were`} not added: the limit is 20 MB per file.`)
    if (discarded) notices.push(`You can add up to ${MAX_ATTACHMENTS} attachments; ${discarded} more ${discarded === 1 ? 'was' : 'were'} not added.`)
    if (kept.length) setAttachments([...attachments, ...kept])
    setAttachmentNotice(notices.join(' '))
    // Images shrink in the background and replace themselves; one sent or removed meanwhile is simply left alone.
    for (const file of kept) {
      void shrinkImage(file).then((shrunk) => {
        if (shrunk !== file) setAttachments((current) => (current.includes(file) ? current.map((entry) => (entry === file ? shrunk : entry)) : current))
      })
    }
  }, [attachments])

  useImperativeHandle(ref, () => ({
    focus() {
      textareaRef.current?.focus({ preventScroll: true })
    },
    addFiles,
    replaceDraft(text: string) {
      setInput(text)
      setAttachments([])
      setAttachmentNotice('')
      requestAnimationFrame(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        resizeTextarea(textarea)
        textarea.focus({ preventScroll: true })
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      })
    },
  }), [addFiles])

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
    addFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  return (
    <div
      className={`composer focus-field${dropActive ? ' is-drop-target' : ''}`}
      onPointerDownCapture={(event) => {
        // Buttons act without taking focus, so the on-screen keyboard stays open.
        if (event.button === 0 && document.activeElement === textareaRef.current && (event.target as Element).closest('button')) event.preventDefault()
      }}
      onClick={(event) => {
        const target = event.target as Element
        // Portal events bubble through React; only clicks in the composer body focus the draft.
        if (!event.currentTarget.contains(target) || target.closest('.composer-controls, button, input, textarea, a')) return
        textareaRef.current?.focus({ preventScroll: true })
      }}
    >
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((file, index) => (
            <div className="composer-attachment" key={`${file.name}-${file.lastModified}-${index}`}>
              {isImageFile(file) ? <AttachmentThumbnail file={file} /> : <Icon name="file-text" size={16} />}
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
      {dropActive && (
        <div className="composer-drop" aria-hidden="true">
          <Icon name="upload" size={22} />
          <span className="composer-drop-title">Drop to attach</span>
          <span className="composer-drop-note">{ACCEPTED_LABEL}</span>
        </div>
      )}
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
          resizeTextarea(event.target)
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-controls">
        <input ref={fileInputRef} name="attachments" type="file" accept={ACCEPTED_FILES} multiple onChange={handleFiles} hidden />
        <div className="composer-controls-left">
          <button type="button" className="btn-icon btn-icon-round" aria-label="Add attachment" title="Add attachment" onClick={() => fileInputRef.current?.click()}>
            <Icon name="paperclip" />
          </button>
          <Menu side="top" align="start" preserveTextFocus renderTrigger={(props) => (
            <button
              {...props}
              type="button"
              className={`composer-thinking${currentThinking.value !== 'off' ? ' is-active' : ''}`}
              aria-label={`Thinking level: ${currentThinking.label}`}
              title="Thinking level"
            >
              <Icon name="brain" size={16} />
              <span className="composer-thinking-label">{currentThinking.label}</span>
            </button>
          )}>
            {thinkingOptions.map((option) => (
              <MenuItem key={option.value} checked={currentThinking.value === option.value} onSelect={() => onThinkingChange(option.value)}>
                {option.label} <span className="menu-item-note">{option.note}</span>
              </MenuItem>
            ))}
          </Menu>
        </div>
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

/** The object URL lives as long as the chip and is released with it. */
function AttachmentThumbnail({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <img className="composer-attachment-thumb" src={url} alt="" />
}
