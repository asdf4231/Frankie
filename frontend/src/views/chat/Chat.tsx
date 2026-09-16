import { useEffect, useLayoutEffect, useRef } from 'react'
import type { AuthMe } from '../../api/client'
import Icon from '../../components/Icon'
import { consumeComposerRequest, sendMessage, stopGeneration, syncRoute, useConversation } from '../../lib/conversation'
import { useRoute } from '../../lib/router'
import Composer, { type ComposerHandle } from './Composer'
import EmptyState from './EmptyState'
import MessageList from './MessageList'
import './chat.css'

/** Conversation data stays in the store; the composer and message list own draft and scroll state. */
export default function Chat({ me }: { me: AuthMe }) {
  const route = useRoute()
  const { sessionId, viewKey, questionRequest, messages, busy, deleting, agentStatus, sessionLoading, loadError, focusRequest, composerRequest } = useConversation()
  const composerRef = useRef<ComposerHandle>(null)
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

  return (
    <div className={`chat${empty ? ' is-empty' : ' has-messages'}`}>
      {loadError && <div className="chat-notices"><p className="chat-error" role="alert"><Icon name="alert-circle" size={16} />{loadError}</p></div>}
      <MessageList
        key={`${me.user_id}:${viewKey}`}
        userId={me.user_id}
        sessionId={sessionId}
        questionRequest={questionRequest}
        messages={messages}
        agentStatus={agentStatus}
        loading={sessionLoading}
        active={route.view === 'chat'}
      />
      <div className="chat-footer">
        <EmptyState active={empty} displayName={me.display_name} onSuggest={(question) => {
          send(question, [])
          composerRef.current?.focus()
        }}>
          <Composer ref={composerRef} busy={busy} disabled={sessionLoading || deleting} onSend={send} onStop={stopGeneration} />
        </EmptyState>
        <p className="chat-disclaimer">Content is AI-generated. Please verify it against the course materials.</p>
      </div>
    </div>
  )
}
