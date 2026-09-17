import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import Icon from '../../components/Icon'
import { usePagingScroll } from '../../hooks/usePagingScroll'
import type { Message } from '../../lib/conversation'
import { loadChatPosition, saveChatPosition, SAVE_CHAT_POSITION_EVENT, type ChatPosition } from '../../lib/chatPosition'
import MessageItem from './MessageItem'

export interface MessageListHandle {
  handlePageKey(event: KeyboardEvent): boolean
}

interface Props {
  ref?: Ref<MessageListHandle>
  userId: string
  sessionId?: string
  questionRequest: number
  messages: Message[]
  agentStatus: string
  busy: boolean
  loading: boolean
  active: boolean
  onRegenerate: (message: Message) => void
  onEditedSend: (message: Message, text: string) => void
}

export default function MessageList({ ref, userId, sessionId, questionRequest, messages, agentStatus, busy, loading, active, onRegenerate, onEditedSend }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  const position = useRef<ChatPosition | undefined>(undefined)
  const initialized = useRef(false)
  const handledQuestion = useRef(0)
  const messageCount = useRef(0)
  const answerHeight = useRef(0)
  const saveTimer = useRef(0)
  const [showJump, setShowJump] = useState(false)
  const [completionAnnouncement, setCompletionAnnouncement] = useState('')
  const runningReply = useRef<string | null>(null)

  const reserveAnswer = useCallback((height: number) => {
    answerHeight.current = height
    columnRef.current?.style.setProperty('--chat-answer-space', `${height}px`)
  }, [])

  const flush = useCallback(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = 0
    if (sessionId && position.current) saveChatPosition(userId, sessionId, position.current)
  }, [sessionId, userId])

  // Only visible message geometry may replace the remembered reading point.
  const capture = useCallback(() => {
    const container = scrollRef.current
    if (!active || loading || !initialized.current || !container?.clientHeight) return
    const top = container.getBoundingClientRect().top
    const anchor = Array.from(columnRef.current?.children ?? []).find((element) => element.getBoundingClientRect().bottom > top + 1) as HTMLElement | undefined
    const replyId = (columnRef.current?.lastElementChild as HTMLElement | null)?.dataset.messageId
    const next: ChatPosition = {
      messageId: anchor?.dataset.messageId,
      offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
      scrollTop: container.scrollTop,
      answerSpace: answerHeight.current > 0 && replyId ? { replyId, height: answerHeight.current } : undefined,
    }
    const previous = position.current
    position.current = next
    setShowJump(container.scrollHeight - container.scrollTop - container.clientHeight >= 48)
    if (!previous || next.messageId !== previous.messageId || next.offset !== previous.offset || next.scrollTop !== previous.scrollTop ||
        next.answerSpace?.replyId !== previous.answerSpace?.replyId || next.answerSpace?.height !== previous.answerSpace?.height) {
      if (!saveTimer.current) saveTimer.current = window.setTimeout(flush, 150)
    }
  }, [active, flush, loading])

  const { handlePageKey, isPaging, scrollTo, stop: stopPaging } = usePagingScroll(scrollRef, {
    enabled: active && !loading,
    allowEditable: true,
    onSettled: capture,
  })

  const restore = useCallback(() => {
    const container = scrollRef.current
    const saved = position.current
    if (!active || loading || isPaging.current || !container?.clientHeight || !saved) return
    const anchor = saved.messageId
      ? columnRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(saved.messageId)}"]`)
      : undefined
    const target = anchor
      ? container.scrollTop + anchor.getBoundingClientRect().top - container.getBoundingClientRect().top - saved.offset
      : saved.scrollTop
    if (Math.abs(container.scrollTop - target) > 0.5) container.scrollTop = target
  }, [active, isPaging, loading])

  useImperativeHandle(ref, () => ({ handlePageKey }), [handlePageKey])

  useLayoutEffect(() => {
    if (active) scrollRef.current?.focus({ preventScroll: true })
  }, [active])

  useLayoutEffect(() => {
    const container = scrollRef.current
    const column = columnRef.current
    if (!active || loading || !container?.clientHeight || !column || !messages.length) return
    let reveal = questionRequest !== handledQuestion.current
    handledQuestion.current = questionRequest
    if (!initialized.current) {
      initialized.current = true
      position.current = sessionId ? loadChatPosition(userId, sessionId) : undefined
      const savedSpace = position.current?.answerSpace
      if (savedSpace && savedSpace.replyId === messages.at(-1)?.id) reserveAnswer(Math.min(savedSpace.height, container.clientHeight * 0.6))
      reveal ||= !position.current
    } else if (messageCount.current !== messages.length) {
      // A newer turn owns the answer area; earlier short replies use their natural height.
      reserveAnswer(0)
    }
    messageCount.current = messages.length
    if (reveal) {
      stopPaging()
      const question = messages.findLast((message) => message.role === 'user')
      const element = question && column.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(question.id)}"]`)
      if (element) {
        const bounds = container.getBoundingClientRect()
        const message = element.getBoundingClientRect()
        const style = getComputedStyle(column)
        const gap = Number.parseFloat(style.rowGap)
        const padding = Number.parseFloat(style.paddingBottom)
        // Keep ordinary questions around 40% down, with at least 30% for the answer.
        // Tall questions move nearer the top instead of hiding their first lines.
        const offset = Math.max(0, Math.min(container.clientHeight * 0.4, container.clientHeight * 0.7 - message.height - gap))
        const target = Math.max(0, container.scrollTop + message.top - bounds.top - offset)
        reserveAnswer(target > 0 ? Math.max(0, container.clientHeight - offset - message.height - gap - padding) : 0)
        container.scrollTop = target
      }
    } else restore()
    capture()
  }, [active, capture, loading, messages, questionRequest, reserveAnswer, restore, sessionId, stopPaging, userId])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.streaming) {
      if (runningReply.current !== last.id) setCompletionAnnouncement('')
      runningReply.current = last.id
    } else if (last?.role === 'assistant' && runningReply.current === last.id) {
      setCompletionAnnouncement(last.status === 'completed' ? "Frankie's reply is complete." : last.status === 'cancelled' ? 'Reply stopped.' : 'Reply generation failed.')
      runningReply.current = null
    }
  }, [messages])

  // Compensate actual layout changes around the saved reading point, including
  // reveal after display:none. Neither answer growth nor completion picks a new anchor.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      const height = scrollRef.current?.clientHeight ?? 0
      if (height && answerHeight.current > height * 0.6) reserveAnswer(height * 0.6)
      restore()
      capture()
    })
    if (scrollRef.current) observer.observe(scrollRef.current)
    if (columnRef.current) observer.observe(columnRef.current)
    return () => observer.disconnect()
  }, [capture, reserveAnswer, restore])

  useEffect(() => {
    flush()
    const save = () => { capture(); flush() }
    const visibility = () => { if (document.visibilityState === 'hidden') save() }
    window.addEventListener(SAVE_CHAT_POSITION_EVENT, save)
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearTimeout(saveTimer.current)
      saveTimer.current = 0
      window.removeEventListener(SAVE_CHAT_POSITION_EVENT, save)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [capture, flush])

  return (
    <div className="chat-history" hidden={!loading && messages.length === 0}>
      <div
        ref={scrollRef}
        className="chat-scroll"
        tabIndex={0}
        aria-label="Chat messages"
        onScroll={capture}
        onWheel={stopPaging}
        onTouchStart={stopPaging}
        onPointerDown={stopPaging}
      >
        <div ref={columnRef} className="chat-column" aria-busy={loading}>
          {loading ? (
            <div className="chat-loading" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">Loading conversation</span></div>
          ) : messages.map((message) => (
            <MessageItem key={message.id} message={message} agentStatus={message.streaming ? agentStatus : ''} busy={busy} onRegenerate={onRegenerate} onEditedSend={onEditedSend} />
          ))}
        </div>
      </div>
      <span className="visually-hidden" role="status">{completionAnnouncement}</span>
      {showJump && !loading && (
        <button type="button" className="btn-icon btn-icon-round chat-jump" onClick={() => {
          const container = scrollRef.current
          if (container) scrollTo(container.scrollHeight)
        }} aria-label="Scroll to bottom" title="Scroll to bottom">
          <Icon name="arrow-down" />
        </button>
      )}
    </div>
  )
}
