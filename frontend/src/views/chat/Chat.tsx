import { useEffect, useLayoutEffect, useRef } from 'react'
import type { AuthMe } from '../../api/client'
import Icon from '../../components/Icon'
import { openReference, sendMessage, stopGeneration, syncRoute, useConversation } from '../../lib/conversation'
import { useRoute } from '../../lib/router'
import Composer, { type ComposerHandle } from './Composer'
import EmptyState from './EmptyState'
import MessageList, { type MessageListHandle } from './MessageList'
import './chat.css'

/** Conversation data stays in the store; the composer and message list own draft and scroll state. */
export default function Chat({ me }: { me: AuthMe }) {
  const route = useRoute()
  const { messages, busy, agentStatus, sessionLoading, loadError, referenceError, focusRequest } = useConversation()
  const composerRef = useRef<ComposerHandle>(null)
  const messageListRef = useRef<MessageListHandle>(null)
  const empty = messages.length === 0 && !sessionLoading

  // Before paint, so a direct link to a session never flashes the empty state.
  useLayoutEffect(() => {
    syncRoute(route)
  }, [route])

  useEffect(() => {
    if (focusRequest > 0) composerRef.current?.focus()
  }, [focusRequest])

  const send = (text: string, files: File[]) => {
    messageListRef.current?.follow()
    void sendMessage(text, files)
  }

  return (
    <div className={`chat${empty ? ' is-empty' : ' has-messages'}`}>
      {(referenceError || loadError) && (
        <div className="chat-notices">
          {referenceError && <p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />无法打开引用：{referenceError}</p>}
          {loadError && <p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />无法加载会话：{loadError}</p>}
        </div>
      )}
      <MessageList
        ref={messageListRef}
        messages={messages}
        agentStatus={agentStatus}
        loading={sessionLoading}
        active={route.view === 'chat'}
        onOpenRef={openReference}
      />
      <div className="chat-footer">
        <EmptyState active={empty} displayName={me.display_name} onSuggest={(question) => {
          send(question, [])
          composerRef.current?.focus()
        }}>
          <Composer ref={composerRef} busy={busy} disabled={sessionLoading} onSend={send} onStop={stopGeneration} />
        </EmptyState>
        <p className="chat-disclaimer">内容由 AI 生成，请结合课件核对</p>
      </div>
    </div>
  )
}
