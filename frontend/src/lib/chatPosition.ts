export const SAVE_CHAT_POSITION_EVENT = 'frankie:save-chat-position'

export interface ChatPosition {
  messageId?: string
  offset: number
  scrollTop: number
  answerSpace?: { replyId: string; height: number }
}

const positions = new Map<string, ChatPosition>()
const key = (userId: string, sessionId: string) => `frankie.chat-position.${userId}.${sessionId}`

export function loadChatPosition(userId: string, sessionId: string): ChatPosition | undefined {
  const name = key(userId, sessionId)
  const saved = positions.get(name)
  if (saved) return saved
  try {
    const value: unknown = JSON.parse(localStorage.getItem(name) ?? 'null')
    if (!value || typeof value !== 'object') return
    const candidate = value as ChatPosition
    if (!Number.isFinite(candidate.offset) || !Number.isFinite(candidate.scrollTop) ||
        (candidate.messageId !== undefined && typeof candidate.messageId !== 'string')) return
    if (candidate.answerSpace !== undefined &&
        (!candidate.answerSpace || typeof candidate.answerSpace.replyId !== 'string' ||
         !Number.isFinite(candidate.answerSpace.height) || candidate.answerSpace.height < 0)) return
    positions.set(name, candidate)
    return candidate
  } catch {
    return undefined
  }
}

export function saveChatPosition(userId: string, sessionId: string, position: ChatPosition) {
  const name = key(userId, sessionId)
  positions.set(name, position)
  try { localStorage.setItem(name, JSON.stringify(position)) } catch { /* Keep the in-memory position. */ }
}

export function clearChatPosition(userId: string, sessionId: string) {
  const name = key(userId, sessionId)
  positions.delete(name)
  try { localStorage.removeItem(name) } catch { /* Storage may be disabled. */ }
}
