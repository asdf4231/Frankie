import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { AuthMe } from '../../api/client'
import Icon from '../../components/Icon'
import { useFileDrop } from '../../hooks/useFileDrop'
import { consumeComposerRequest, resendMessage, sendMessage, setConversationThinking, stopGeneration, syncRoute, useConversation, type Message } from '../../lib/conversation'
import { useRoute } from '../../lib/router'
import Composer, { type ComposerHandle } from './Composer'
import EmptyState from './EmptyState'
import MessageList, { type MessageListHandle } from './MessageList'
import './chat.css'

/** Conversation data stays in the store; the composer and message list own draft and scroll state. */
export default function Chat({ me }: { me: AuthMe }) {
  const route = useRoute()
  const { sessionId, viewKey, questionRequest, thinking, messages, busy, deleting, agentStatus, sessionLoading, loadError, focusRequest, composerRequest } = useConversation()
  const chatRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<ComposerHandle>(null)
  const messageListRef = useRef<MessageListHandle>(null)
  const handledComposerRequest = useRef(0)
  const empty = messages.length === 0 && !sessionLoading

  // Before paint, so a direct link to a session never flashes the empty state.
  useLayoutEffect(() => {
    syncRoute(route)
  }, [route])

  useEffect(() => {
    if (focusRequest > 0) composerRef.current?.focus()
  }, [focusRequest])

  useEffect(() => {
    const composer = composerRef.current
    if (!composerRequest || !composer || handledComposerRequest.current === composerRequest.id) return
    handledComposerRequest.current = composerRequest.id
    composer.replaceDraft(composerRequest.text)
    consumeComposerRequest(composerRequest.id)
  }, [composerRequest])

  const send = (text: string, files: File[]) => {
    void sendMessage(text, files)
  }

  // Files can be dropped anywhere in the chat; the composer is the visible landing spot.
  const handleDrop = useCallback((files: File[]) => {
    composerRef.current?.addFiles(files)
    composerRef.current?.focus()
  }, [])
  const dropActive = useFileDrop(chatRef, handleDrop)

  const handleRegenerate = useCallback((message: Message) => {
    void resendMessage(message)
  }, [])

  const handleEditedSend = useCallback((message: Message, text: string) => {
    void resendMessage(message, text)
  }, [])

  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (route.view === 'chat' && messageListRef.current?.handlePageKey(event.nativeEvent)) event.preventDefault()
  }

  return (
    <div ref={chatRef} className={`chat${empty ? ' is-empty' : ' has-messages'}${dropActive ? ' is-dropping' : ''}`} onKeyDownCapture={handleKeyDownCapture}>
      {loadError && <div className="chat-notices"><p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />{loadError}</p></div>}
      <MessageList
        key={`${me.user_id}:${viewKey}`}
        ref={messageListRef}
        userId={me.user_id}
        sessionId={sessionId}
        questionRequest={questionRequest}
        messages={messages}
        agentStatus={agentStatus}
        busy={busy}
        loading={sessionLoading}
        active={route.view === 'chat'}
        onRegenerate={handleRegenerate}
        onEditedSend={handleEditedSend}
      />
      <div className="chat-footer">
        <EmptyState active={empty} displayName={me.display_name} onSuggest={(question) => {
          send(question, [])
          composerRef.current?.focus()
        }}>
          <Composer
            ref={composerRef}
            thinking={thinking}
            busy={busy}
            disabled={sessionLoading || deleting}
            dropActive={dropActive}
            onThinkingChange={setConversationThinking}
            onSend={send}
            onStop={stopGeneration}
          />
        </EmptyState>
        <p className="chat-disclaimer">AI can make mistakes. Verify with course materials.</p>
      </div>
    </div>
  )
}
