import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { CHAT_SUGGESTIONS } from './chatSuggestions'

// The router needs browser globals at import time; no components or DOM are rendered.
let conversation: typeof import('./conversation')
let removeSession: typeof import('./sessions')['removeSession']
const fetchMock = vi.fn<typeof fetch>()

beforeAll(async () => {
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    location: new URL('http://localhost/?view=chat'),
  }))
  vi.stubGlobal('history', { state: { frankieEntryKey: 'test' } })
  conversation = await import('./conversation')
  removeSession = (await import('./sessions')).removeSession
})

beforeEach(() => {
  conversation.newChat()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://localhost').pathname
    if (path === '/api/chat') {
      // Keep the reply in flight until the conversation aborts it.
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      })
    }
    if (path === '/api/history/existing') {
      return Response.json({ session: { session_id: 'existing', topic: 'Existing chat', messages: [] } })
    }
    throw new Error(`Unexpected request: ${path}`)
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => conversation.resetConversation())
afterAll(() => vi.unstubAllGlobals())

// EmptyState's onSuggest callback calls sendMessage(question, []). Use the same
// suggestion data as the UI and exercise that action through the real API/SSE code.
test.each(CHAT_SUGGESTIONS)('submits the suggested question from a new chat: %s', async (question) => {
  expect(conversation.getConversation().sessionId).toBeUndefined()
  await conversation.sendMessage(question, [])

  expect(fetchMock).toHaveBeenCalledOnce()
  const [url, request] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/chat')
  expect(request?.method).toBe('POST')
  const form = request?.body as FormData
  expect(form.get('message')).toBe(question)
  expect(form.has('session_id')).toBe(false)
  expect(conversation.getConversation().messages[0]).toMatchObject({ role: 'user', content: question })
  expect(conversation.getConversation().busy).toBe(true)
})

test('blocks sends only in the conversation being deleted, including after reopening it', async () => {
  conversation.syncRoute({ view: 'chat', session: 'existing' })
  await vi.waitFor(() => expect(conversation.getConversation().sessionLoading).toBe(false))
  let finishDeletion!: (response: Response) => void
  const deletionResponse = new Promise<Response>((resolve) => { finishDeletion = resolve })
  const defaultFetch = fetchMock.getMockImplementation()!
  fetchMock.mockImplementation((input, init) => init?.method === 'DELETE'
    ? deletionResponse
    : defaultFetch(input, init))

  const deletion = conversation.deleteSessionWhenIdle('existing', () => removeSession('existing'))
  try {
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true))
    const callsBeforeSend = fetchMock.mock.calls.length
    await conversation.sendMessage('Must not send while deleting', [])
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeSend)

    conversation.newChat()
    await conversation.sendMessage(CHAT_SUGGESTIONS[0], [])
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/chat')
    expect(conversation.getConversation().busy).toBe(true)

    conversation.syncRoute({ view: 'chat', session: 'existing' })
    await vi.waitFor(() => expect(conversation.getConversation().sessionLoading).toBe(false))
    expect(conversation.getConversation().deleting).toBe(true)
    const callsAfterReopening = fetchMock.mock.calls.length
    await conversation.sendMessage('Still must not send', [])
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterReopening)
  } finally {
    finishDeletion(Response.json({ ok: true }))
    await deletion
  }
  expect(conversation.getConversation().deleting).toBe(false)
})
