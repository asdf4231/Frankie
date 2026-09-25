import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { CHAT_SUGGESTIONS } from './chatSuggestions'

// The router needs browser globals at import time; no components or DOM are rendered.
let conversation: typeof import('./conversation')
let removeSession: typeof import('./sessions')['removeSession']
const fetchMock = vi.fn<typeof fetch>()

beforeAll(async () => {
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    location: new URL('http://localhost/?view=chat'),
    setTimeout,
  }))
  vi.stubGlobal('history', {
    state: { frankieEntryKey: 'test' },
    replaceState(state: unknown, _title: string, url: string) {
      Object.assign(history, { state })
      Object.assign(window, { location: new URL(url, window.location.href) })
    },
  })
  conversation = await import('./conversation')
  removeSession = (await import('./sessions')).removeSession
})

beforeEach(() => {
  conversation.newChat()
  Object.assign(window, { location: new URL('http://localhost/?view=chat') })
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input, init) => {
    const path = new URL(String(input), 'http://localhost').pathname
    if (path === '/api/chat') {
      return Response.json({ session_id: 'accepted', turn_id: 'turn', topic: 'Chat', attachments: [] })
    }
    if (path === '/api/chat/accepted/turn/events') {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      })
    }
    if (path === '/api/history') return Response.json({ sessions: [] })
    if (path === '/api/history/existing') {
      return Response.json({ session: { session_id: 'existing', topic: 'Existing chat', thinking_level: 'low', messages: [] } })
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

  const submissions = fetchMock.mock.calls.filter(([url]) => url === '/api/chat')
  expect(submissions).toHaveLength(1)
  const [url, request] = submissions[0]
  expect(url).toBe('/api/chat')
  expect(request?.method).toBe('POST')
  const form = request?.body as FormData
  expect(form.get('message')).toBe(question)
  expect(form.has('session_id')).toBe(false)
  expect(conversation.getConversation().messages[0]).toMatchObject({ role: 'user', content: question })
  expect(conversation.getConversation().busy).toBe(true)
})

test('streams reasoning separately from the answer and restores it from history', async () => {
  let send!: (event: unknown) => void
  const encoder = new TextEncoder()
  const events = new ReadableStream<Uint8Array>({
    start(controller) {
      send = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
  })
  let status: 'running' | 'completed' = 'running'
  const defaultFetch = fetchMock.getMockImplementation()!
  fetchMock.mockImplementation((input, init) => {
    const path = new URL(String(input), 'http://localhost').pathname
    if (path === '/api/history/existing') return Promise.resolve(Response.json({ session: {
      session_id: 'existing', topic: 'Existing chat', thinking_level: 'low', messages: [
        { id: 'u-turn', turn_id: 'turn', role: 'user', content: 'Question', status: 'completed' },
        { id: 'a-turn', turn_id: 'turn', role: 'assistant', content: status === 'running' ? '' : 'Answer',
          reasoning: status === 'running' ? '' : 'Step one. Step two.',
          reasoning_seconds: status === 'running' ? 0 : 2.25, status },
      ],
    } }))
    if (path === '/api/chat/existing/turn/events') return Promise.resolve(new Response(events, {
      headers: { 'content-type': 'text/event-stream' },
    }))
    return defaultFetch(input, init)
  })

  conversation.syncRoute({ view: 'chat', session: 'existing' })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]?.streaming).toBe(true))
  send({ type: 'reply', turn_id: 'turn', text: '', reset: true,
    reasoning: 'Step one.', reasoning_reset: true, reasoning_active: true,
    reasoning_seconds: 0, status: 'running', error: null, agent_status: null })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]?.reasoning).toBe('Step one.'))
  send({ type: 'reply', turn_id: 'turn', text: '', reset: false,
    reasoning: ' Step two.', reasoning_reset: false, reasoning_active: true,
    reasoning_seconds: 0, status: 'running', error: null, agent_status: null })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]?.reasoning).toBe('Step one. Step two.'))
  send({ type: 'reply', turn_id: 'turn', text: 'Provisional answer', reset: true,
    reasoning: '', reasoning_reset: false, reasoning_active: true,
    reasoning_seconds: 0, status: 'running', error: null,
    agent_status: { name: 'search_wiki', status: 'running' } })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]).toMatchObject({
    content: 'Provisional answer', reasoningActive: true, reasoningSeconds: 0,
  }))
  status = 'completed'
  send({ type: 'reply', turn_id: 'turn', text: 'Answer', reset: true,
    reasoning: 'Step one. Step two.', reasoning_reset: true, reasoning_active: false,
    reasoning_seconds: 2.25, status, error: null, agent_status: null })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]).toMatchObject({
    content: 'Answer', reasoning: 'Step one. Step two.', reasoningSeconds: 2.25,
    reasoningActive: false, streaming: false,
  }))
  conversation.newChat()
  conversation.syncRoute({ view: 'chat', session: 'existing' })
  await vi.waitFor(() => expect(conversation.getConversation().messages[1]).toMatchObject({
    content: 'Answer', reasoning: 'Step one. Step two.', reasoningSeconds: 2.25,
    reasoningActive: false, streaming: false,
  }))
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

  const deletion = conversation.deleteConversation('existing', () => removeSession('existing'))
  try {
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true))
    const callsBeforeSend = fetchMock.mock.calls.length
    await conversation.sendMessage('Must not send while deleting', [])
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeSend)

    conversation.newChat()
    await conversation.sendMessage(CHAT_SUGGESTIONS[0], [])
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/chat')).toBe(true)
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
