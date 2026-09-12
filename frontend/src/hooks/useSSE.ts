import { useCallback, useEffect, useRef } from 'react'
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

interface SSEOptions {
  onSession?: (event: SessionEvent) => void
  onChunk: (text: string) => void
  onAgentStatus?: (event: AgentStatusEvent) => void
  onAttachments?: (attachments: AttachmentRef[]) => void
  onDone?: (event: DoneEvent) => void
  onError?: (err: Error) => void
}

/** Fetch and consume one chat SSE stream. Starting or aborting a request invalidates
 * every callback from the preceding request.
 *
 * Text chunks are coalesced and delivered at most once per animation frame, so the UI
 * re-renders per frame rather than per token. Pending text is always flushed before any
 * following non-chunk event, so ordering is preserved. */
export function useSSE({ onSession, onChunk, onAgentStatus, onAttachments, onDone, onError }: SSEOptions) {
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const discardPendingRef = useRef<() => void>(() => {})

  const send = useCallback(
    async (url: string, init?: RequestInit) => {
      abortRef.current?.abort()
      discardPendingRef.current()
      const requestId = ++requestIdRef.current
      const controller = new AbortController()
      abortRef.current = controller
      const isActive = () => requestIdRef.current === requestId && abortRef.current === controller && !controller.signal.aborted

      let pendingText = ''
      let frame = 0
      const flushChunks = () => {
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
        if (!pendingText) return
        const text = pendingText
        pendingText = ''
        if (isActive()) onChunk(text)
      }
      discardPendingRef.current = () => {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        pendingText = ''
      }

      try {
        const resp = await fetch(url, {
          method: 'POST',
          ...init,
          signal: controller.signal,
          headers: {
            ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(init?.headers as Record<string, string> | undefined),
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
              onSession?.(data as unknown as SessionEvent)
              break
            case 'agent_status':
              onAgentStatus?.(data as unknown as AgentStatusEvent)
              break
            case 'attachments':
              onAttachments?.(data.attachments as AttachmentRef[])
              break
            case 'error':
              onError?.(new Error(String(data.message ?? '生成失败')))
              break
            case 'done':
              sawDone = true
              terminal = true
              onDone?.(data as unknown as DoneEvent)
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
          onError?.(err as Error)
          controller.abort()
        }
      } finally {
        flushChunks()
        if (requestIdRef.current === requestId && abortRef.current === controller) abortRef.current = null
      }
    },
    [onSession, onChunk, onAgentStatus, onAttachments, onDone, onError],
  )

  const abort = useCallback(() => {
    requestIdRef.current += 1
    discardPendingRef.current()
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => abort, [abort])

  return { send, abort }
}
