import type { ReactNode } from 'react'

const SUGGESTIONS = [
  'How is the course grade determined?',
  'How much mathematical theory is involved in this course?',
  'How are dynamic programming and optimal control related?',
]

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
          {SUGGESTIONS.map((question) => (
            <button key={question} type="button" className="btn btn-ghost chat-suggestion" onClick={() => onSuggest(question)}>
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
