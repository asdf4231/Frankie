/*
 * Shared-line display-math behavior adapted from microsoft/vscode-markdown-it-katex
 * at efd01d8e61b4aca4d8b1489d15dd29f641663119. Flow-fence mechanics follow
 * micromark-extension-math 3.1.0. MIT licenses and full provenance:
 * frontend/third-party/vscode-markdown-it-katex-LICENSE.txt
 */

import { mathFromMarkdown, mathToMarkdown, type ToOptions } from 'mdast-util-math'
import { math } from 'micromark-extension-math'
import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding } from 'micromark-util-character'
import type { Construct, Effects, Extension, State, TokenizeContext } from 'micromark-util-types'

const DOLLAR = 36

type ClosingRun = { offset: number; size: number }

// After an EOF failure, reuse the line-ending dollar runs already examined.
// Only suffix maxima are needed: their offsets increase and widths decrease.
// `write` identifies the owning flow even when micromark wraps its context for
// an interruption probe; separate flows and documents never share failures.
const unclosedDisplays = new WeakMap<TokenizeContext['write'], { offset: number; closers: ClosingRun[] }>()

const nonLazyContinuation: Construct = {
  tokenize: tokenizeNonLazyContinuation,
  partial: true,
}

const openingLineEnd: Construct = {
  tokenize: tokenizeOpeningLineEnd,
  partial: true,
}

const chatMathFlow: Construct = {
  tokenize: tokenizeChatMathFlow,
  concrete: true,
  name: 'chatMathFlow',
}

type ProcessorData = {
  micromarkExtensions?: Extension[]
  fromMarkdownExtensions?: Array<ReturnType<typeof mathFromMarkdown>>
  toMarkdownExtensions?: Array<ReturnType<typeof mathToMarkdown>>
}

/** Keep remark-math's inline syntax and mdast output, replacing only display parsing. */
export function remarkChatMath(this: unknown, options?: Readonly<ToOptions> | null): undefined {
  const settings = options ?? {}
  const data = (this as { data(): ProcessorData }).data()
  const syntax = math(settings)
  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = [])
  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

  micromarkExtensions.push({ ...syntax, flow: { ...syntax.flow, [DOLLAR]: chatMathFlow } })
  fromMarkdownExtensions.push(mathFromMarkdown())
  toMarkdownExtensions.push(mathToMarkdown(settings))
}

/**
 * Parse a display opened by a run of at least two dollars at a Markdown flow
 * boundary. Unlike the standard math fence, formula content may share both
 * delimiter lines. The first eligible closer must end its line.
 */
function tokenizeChatMathFlow(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  const flow = this.write
  const contextOffset = () => this.now().offset
  const parser = this.parser
  const interrupt = this.interrupt
  const startOffset = this.now().offset
  const tail = this.events[this.events.length - 1]
  const initialSize = tail?.[1].type === 'linePrefix' ? tail[2].sliceSerialize(tail[1], true).length : 0
  let sizeOpen = 0
  let backslashes = 0
  let dollars = 0
  let eligibleCloser = false
  const closers: ClosingRun[] = []

  const closingFence: Construct = {
    tokenize: tokenizeClosingFence,
    partial: true,
  }

  const closingFenceLine: Construct = {
    tokenize: tokenizeClosingFenceLine,
    partial: true,
  }

  return start

  function start(code: number | null): State | undefined {
    if (code !== DOLLAR) return nok(code)
    effects.enter('mathFlow')
    effects.enter('mathFlowFence')
    effects.enter('mathFlowFenceSequence')
    return sequenceOpen(code)
  }

  function sequenceOpen(code: number | null): State | undefined {
    if (code === DOLLAR) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }
    if (sizeOpen < 2) return nok(code)

    effects.exit('mathFlowFenceSequence')
    effects.exit('mathFlowFence')
    return effects.attempt(openingLineEnd, afterOpeningLine, openingContent)(code)
  }

  function knownUnclosed(): boolean {
    const failure = unclosedDisplays.get(flow)
    if (!failure || startOffset < failure.offset) return false
    // Exclude the new opener itself when looking for a later possible closer.
    const afterOpening = contextOffset()
    let low = 0
    let high = failure.closers.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (failure.closers[middle].offset < afterOpening) low = middle + 1
      else high = middle
    }
    return low === failure.closers.length || failure.closers[low].size < sizeOpen
  }

  function afterOpeningLine(code: number | null): State | undefined {
    // A conventional opener interrupts before its body is parsed. The cache
    // must not change that paragraph boundary, even if the body cannot close.
    if (interrupt) return ok(code)
    if (knownUnclosed()) return nok(code)
    if (code === null) return fail(code)
    return effects.attempt(nonLazyContinuation, afterLineEnding, fail)(code)
  }

  function openingContent(code: number | null): State | undefined {
    return knownUnclosed() ? nok(code) : contentStart(code)
  }

  function afterLineEnding(code: number | null): State | undefined {
    eligibleCloser = false
    return effects.attempt(closingFenceLine, done, rejectedAtLineStart)(code)
  }

  function rejectedAtLineStart(code: number | null): State | undefined {
    return eligibleCloser ? fail(code) : contentStart(code)
  }

  function contentStart(code: number | null): State | undefined {
    backslashes = 0
    dollars = 0
    if (code === null) return fail(code)
    if (markdownLineEnding(code)) {
      return effects.attempt(nonLazyContinuation, afterLineEnding, fail)(code)
    }
    return (initialSize
      ? factorySpace(effects, beforeContent, 'linePrefix', initialSize + 1)
      : beforeContent)(code)
  }

  function beforeContent(code: number | null): State | undefined {
    if (code === null) return fail(code)
    if (markdownLineEnding(code)) {
      return effects.attempt(nonLazyContinuation, afterLineEnding, fail)(code)
    }
    effects.enter('mathFlowValue')
    return content(code)
  }

  function content(code: number | null): State | undefined {
    if (code === null) {
      effects.exit('mathFlowValue')
      return fail(code)
    }
    if (markdownLineEnding(code)) {
      effects.exit('mathFlowValue')
      return effects.attempt(nonLazyContinuation, afterLineEnding, fail)(code)
    }
    if (code === DOLLAR && backslashes % 2 === 0 && dollars === 0) {
      effects.exit('mathFlowValue')
      eligibleCloser = false
      return effects.attempt(closingFence, done, rejectedInContent)(code)
    }

    consumeContent(code)
    return content
  }

  function rejectedInContent(code: number | null): State | undefined {
    return eligibleCloser ? fail(code) : resumeContent(code)
  }

  function resumeContent(code: number | null): State | undefined {
    effects.enter('mathFlowValue')
    consumeContent(code)
    return content
  }

  function consumeContent(code: number | null): void {
    effects.consume(code)
    if (code === 92) {
      backslashes++
      dollars = 0
    } else if (code === DOLLAR) {
      dollars++
      backslashes = 0
    } else {
      backslashes = 0
      dollars = 0
    }
  }

  function done(code: number | null): State | undefined {
    effects.exit('mathFlow')
    return ok(code)
  }

  function fail(code: number | null): State | undefined {
    if (code === null) {
      unclosedDisplays.set(flow, { offset: startOffset, closers })
    }
    return nok(code)
  }

  function tokenizeClosingFenceLine(
    this: TokenizeContext,
    closingEffects: Effects,
    closingOk: State,
    closingNok: State,
  ): State {
    const closing = tokenizeClosingFence.bind(this)
    const maximum = parser.constructs.disable.null?.includes('codeIndented') ? undefined : 4
    return factorySpace(closingEffects, beforeFence, 'linePrefix', maximum)

    function beforeFence(code: number | null): State | undefined {
      return closing(closingEffects, closingOk, closingNok)(code)
    }
  }

  function tokenizeClosingFence(
    this: TokenizeContext,
    closingEffects: Effects,
    closingOk: State,
    closingNok: State,
  ): State {
    let size = 0
    const offset = this.now().offset
    return first

    function first(code: number | null): State | undefined {
      if (code !== DOLLAR) return closingNok(code)
      closingEffects.enter('mathFlowFence')
      closingEffects.enter('mathFlowFenceSequence')
      return sequenceClose(code)
    }

    function sequenceClose(code: number | null): State | undefined {
      if (code === DOLLAR) {
        closingEffects.consume(code)
        size++
        return sequenceClose
      }
      eligibleCloser = size >= sizeOpen
      closingEffects.exit('mathFlowFenceSequence')
      return factorySpace(closingEffects, afterWhitespace, 'whitespace')(code)
    }

    function afterWhitespace(code: number | null): State | undefined {
      if (code !== null && !markdownLineEnding(code)) return closingNok(code)
      // A later, equally wide or wider run makes earlier ones irrelevant to
      // the absence check. Duplicate probes of the same run also collapse.
      while (closers.length && closers[closers.length - 1].size <= size) closers.pop()
      closers.push({ offset, size })
      if (!eligibleCloser) return closingNok(code)
      closingEffects.exit('mathFlowFence')
      return closingOk(code)
    }
  }
}

function tokenizeOpeningLineEnd(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  return factorySpace(effects, afterWhitespace, 'whitespace')

  function afterWhitespace(code: number | null): State | undefined {
    return code !== null && markdownLineEnding(code) ? ok(code) : nok(code)
  }
}

function tokenizeNonLazyContinuation(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  const parser = this.parser
  const now = this.now.bind(this)
  return start

  function start(code: number | null): State | undefined {
    if (code === null) return ok(code)
    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return lineStart
  }

  function lineStart(code: number | null): State | undefined {
    return parser.lazy[now().line] ? nok(code) : ok(code)
  }
}
