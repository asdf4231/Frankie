import type { ReactNode } from 'react'

const SUGGESTIONS = [
  '什么是 Bellman 方程？',
  'Kuhn–Tucker 条件的直观理解',
  '动态规划与最优控制有什么关系？',
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
      {active && <h1 className="chat-greeting">你好，{displayName}</h1>}
      {children}
      {active && (
        <div className="chat-suggestions" aria-label="试试这样问">
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
