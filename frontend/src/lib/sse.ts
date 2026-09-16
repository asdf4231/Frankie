import { errorDetail, errorStatus, SafeError } from '../api/client'

export interface StreamHandle {
  /** Stop reading and silence every later callback. */
  abort(): void
}

/** Reconnect a read-only SSE subscription. Returning true from onEvent finishes it. */
export function subscribeEvents<T>(
  url: string,
  onEvent: (event: T) => boolean | void,
  onError: (error: unknown) => void,
): StreamHandle {
  const controller = new AbortController()
  let retry = 0
  let delay = 1000
  let disconnectedAt: number | undefined
  let warned = false
  const isActive = () => !controller.signal.aborted

  const run = async () => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
      const resp = await fetch(url, { signal: controller.signal, credentials: 'include' })
      if (!isActive()) return
      if (!resp.ok) throw await errorDetail(resp, url)
      if (!resp.body) throw new SafeError('The reply connection is unavailable. Try again in a moment.')

      reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let dataLines: string[] = []
      let terminal = false

      const dispatchEvent = () => {
        if (dataLines.length === 0) return
        const payload = dataLines.join('\n')
        dataLines = []

        if (!isActive()) return
        let data: T
        try {
          data = JSON.parse(payload) as T
        } catch {
          throw new SafeError('Live update data is malformed.')
        }
        delay = 1000
        disconnectedAt = undefined
        warned = false
        terminal = onEvent(data) === true
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

      while (!terminal && isActive()) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          processBuffer(true)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        processBuffer(false)
      }

      if (terminal) return
      if (isActive()) throw new SafeError('Live updates disconnected. Reconnecting…')
    } catch (error) {
      if (!isActive()) return
      if ([401, 403, 404].includes(errorStatus(error) ?? 0)) {
        onError(error)
        return
      }
      // Reconnect silently through brief reload/network interruptions. Report
      // a sustained outage once, rather than flashing an alert on each retry.
      disconnectedAt ??= Date.now()
      if (!warned && Date.now() - disconnectedAt >= 10_000) {
        warned = true
        onError(error)
      }
    } finally {
      await reader?.cancel().catch(() => {})
    }
    if (isActive()) {
      retry = window.setTimeout(() => void run(), delay)
      delay = Math.min(delay * 2, 15_000)
    }
  }
  void run()

  return {
    abort() {
      clearTimeout(retry)
      controller.abort()
    },
  }
}
