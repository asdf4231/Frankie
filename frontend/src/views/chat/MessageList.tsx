import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import Icon from '../../components/Icon'
import type { Message } from '../../lib/conversation'
import MessageItem from './MessageItem'

export interface MessageListHandle {
  follow(): void
}

interface Props {
  ref?: Ref<MessageListHandle>
  messages: Message[]
  agentStatus: string
  loading: boolean
  active: boolean
  onOpenRef: (target: string) => void
}

export default function MessageList({ ref, messages, agentStatus, loading, active, onOpenRef }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  const shouldFollow = useRef(true)
  const firstMessage = useRef<string | undefined>(undefined)
  const frame = useRef(0)
  const [showJump, setShowJump] = useState(false)

  const updateScroll = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const container = scrollRef.current
      // A hidden Chat has no layout. Preserve its follow state until it is visible again.
      if (!container || !container.clientHeight) return
      if (shouldFollow.current) container.scrollTop = container.scrollHeight
      setShowJump(container.scrollHeight - container.scrollTop - container.clientHeight >= 48)
    })
  }, [])

  const follow = () => {
    shouldFollow.current = true
    setShowJump(false)
    updateScroll()
  }
  useImperativeHandle(ref, () => ({ follow }))

  const firstId = messages[0]?.id
  const lastContentLength = messages[messages.length - 1]?.content.length ?? 0
  useLayoutEffect(() => {
    if (firstMessage.current !== firstId) {
      firstMessage.current = firstId
      shouldFollow.current = true
    }
    updateScroll()
  }, [firstId, messages.length, lastContentLength, agentStatus, loading, active, updateScroll])

  // Also follow image loads, composer resizing, and sidebar/viewport changes without parsing messages again.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(updateScroll)
    if (scrollRef.current) observer.observe(scrollRef.current)
    if (columnRef.current) observer.observe(columnRef.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [updateScroll])

  return (
    <div className="chat-history" hidden={!loading && messages.length === 0}>
      <div
        ref={scrollRef}
        className="chat-scroll"
        tabIndex={0}
        aria-label="聊天消息"
        onScroll={(event) => {
          const container = event.currentTarget
          if (!container.clientHeight) return
          shouldFollow.current = container.scrollHeight - container.scrollTop - container.clientHeight < 48
          setShowJump(!shouldFollow.current)
        }}
      >
        <div ref={columnRef} className="chat-column" aria-busy={loading}>
          {loading ? (
            <div className="chat-loading" role="status"><Icon name="loader" className="spin" /><span className="visually-hidden">正在加载会话</span></div>
          ) : messages.map((message) => (
            <MessageItem key={message.id} message={message} agentStatus={message.streaming ? agentStatus : ''} onOpenRef={onOpenRef} />
          ))}
        </div>
      </div>
      {showJump && !loading && (
        <button type="button" className="btn-icon btn-icon-round chat-jump" onClick={follow} aria-label="滚动到底部" title="滚动到底部">
          <Icon name="arrow-down" />
        </button>
      )}
    </div>
  )
}
