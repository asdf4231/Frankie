import type { ReactNode } from 'react'
import { CHAT_SUGGESTIONS } from '../../lib/chatSuggestions'

interface Props {
  active: boolean
  displayName: string
  onSuggest: (question: string) => void
  children: ReactNode
}

/** Keep the composer at the same tree position when the greeting and suggestions disappear. */
export default function EmptyState({ active, displayName, onSuggest, children }: Props) {
  return (
    <div className="chat-compose-area">
      {active && <p className="chat-greeting">Hello, {displayName}</p>}
      {children}
      {active && (
        <div className="chat-suggestions" aria-label="Try these questions">
          {CHAT_SUGGESTIONS.map((question) => (
            <button key={question} type="button" className="btn btn-ghost chat-suggestion" onClick={() => onSuggest(question)}>
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
