import type { AttachmentRef, MessageStatus } from '../api/client'

export interface SessionEvent {
  type: 'session'
  session_id: string
  topic: string | null
}

export interface AgentStatusEvent {
  type: 'agent_status'
  call_id: string
  name: string
  query?: string
  path?: string
  status: 'running' | 'completed' | 'error'
}

export interface DoneEvent {
  type: 'done'
  status: Exclude<MessageStatus, 'running'>
  usage: unknown
}

export interface StreamHandlers {
  onSession?: (event: SessionEvent) => void
  onChunk: (text: string) => void
  onAgentStatus?: (event: AgentStatusEvent) => void
  onAttachments?: (attachments: AttachmentRef[]) => void
  onDone?: (event: DoneEvent) => void
  onError?: (error: Error) => void
}

export interface StreamHandle {
  /** Stop reading and silence every later callback. */
  abort(): void
}

/** POST to a chat SSE endpoint and dispatch its events.
 *
 * Text chunks are coalesced and delivered at most once per animation frame, so the UI
 * re-renders per frame rather than per token. Pending text is always flushed before any
 * following non-chunk event, so ordering is preserved. */
export function streamChat(url: string, init: RequestInit, handlers: StreamHandlers): StreamHandle {
  const controller = new AbortController()
  let pendingText = ''
  let frame = 0
  const isActive = () => !controller.signal.aborted

  const flushChunks = () => {
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    if (!pendingText) return
    const text = pendingText
    pendingText = ''
    if (isActive()) handlers.onChunk(text)
  }

  const run = async () => {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        ...init,
        signal: controller.signal,
        headers: {
          ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(init.headers as Record<string, string> | undefined),
        },
        credentials: 'include',
      })

      if (!isActive()) return
      if (!resp.ok) {
        const detail = await resp.text()
        throw new Error(detail ? `HTTP ${resp.status}: ${detail}` : `HTTP ${resp.status}`)
      }
      if (!resp.body) throw new Error('响应没有可读取的数据流')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let dataLines: string[] = []
      let sawDone = false
      let terminal = false

      const dispatchEvent = () => {
        if (dataLines.length === 0) return
        const payload = dataLines.join('\n')
        dataLines = []

        let data: Record<string, unknown>
        try {
          data = JSON.parse(payload) as Record<string, unknown>
        } catch {
          throw new Error('服务器返回了无效的 SSE JSON 数据')
        }
        if (!isActive()) return

        if (data.type === 'chunk') {
          pendingText += String(data.text ?? '')
          if (!frame) frame = requestAnimationFrame(flushChunks)
          return
        }
        flushChunks()

        switch (data.type) {
          case 'session':
            handlers.onSession?.(data as unknown as SessionEvent)
            break
          case 'agent_status':
            handlers.onAgentStatus?.(data as unknown as AgentStatusEvent)
            break
          case 'attachments':
            handlers.onAttachments?.(data.attachments as AttachmentRef[])
            break
          case 'error':
            handlers.onError?.(new Error(String(data.message ?? '生成失败')))
            break
          case 'done':
            sawDone = true
            terminal = true
            handlers.onDone?.(data as unknown as DoneEvent)
            break
        }
      }

      const processLine = (rawLine: string) => {
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
        if (line === '') {
          dispatchEvent()
          return
        }
        if (line.startsWith(':')) return
        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        let value = colon === -1 ? '' : line.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        if (field === 'data') dataLines.push(value)
      }

      const processBuffer = (final: boolean) => {
        let newline = buffer.indexOf('\n')
        while (newline !== -1 && !terminal) {
          processLine(buffer.slice(0, newline))
          buffer = buffer.slice(newline + 1)
          newline = buffer.indexOf('\n')
        }
        if (final && !terminal) {
          if (buffer) processLine(buffer)
          buffer = ''
          dispatchEvent()
        }
      }

      while (!terminal) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          processBuffer(true)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        processBuffer(false)
      }

      if (terminal) await reader.cancel().catch(() => {})
      if (isActive() && !sawDone) throw new Error('SSE 数据流在完成事件前中断')
    } catch (err) {
      if (isActive() && (err as Error).name !== 'AbortError') {
        flushChunks()
        handlers.onError?.(err as Error)
        controller.abort()
      }
    } finally {
      flushChunks()
    }
  }
  void run()

  return {
    abort() {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      pendingText = ''
      controller.abort()
    },
  }
}
