import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import katex from 'katex'
import MessageContent from '../src/components/MessageContent'
import { check, equal, runMathCopyCases, type Result } from './math-copy.cases'
import { nativeFixture, nativeResult } from './math-copy.native'
import golden from './fixtures/math-copy.json'

const render = (latex: string, displayMode = false) => katex.renderToString(latex, { displayMode, strict: false })

async function run(): Promise<Result[]> {
  const results = runMathCopyCases(render, golden)
  // Exercise the actual renderer, parser choices and React effect lifecycle.
  for (const [name, sourcePath] of [['Chat', undefined], ['Wiki', 'concepts/test.md'], ['Lectures', 'raw/lecture-10.md']] as const) {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    try {
      flushSync(() => root.render(<StrictMode><MessageContent sourcePath={sourcePath} content={"The Euler equation is $u'(c_t)=\\beta(1+r)u'(c_{t+1})$, which describes allocation."} /></StrictMode>))
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const md = host.querySelector('.md')!
      check(md.querySelector('.katex-mathml') && md.querySelector('.katex-html'), 'Expected unchanged dual KaTeX rendering')
      const before = md.innerHTML
      const range = document.createRange()
      range.selectNodeContents(md)
      const selection = document.getSelection()!
      selection.removeAllRanges(); selection.addRange(range)
      const e = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })
      md.dispatchEvent(e)
      equal(e.defaultPrevented, true)
      equal(e.clipboardData!.getData('text/plain'), 'The Euler equation is u′(cₜ) = β(1 + r)u′(cₜ₊₁), which describes allocation.')
      check(!/katex|<math|annotation/.test(e.clipboardData!.getData('text/html')), 'Renderer leaked into rich HTML')
      equal(md.innerHTML, before)
      results.push({ name: `${name}: MessageContent integration under StrictMode` })
    } catch (error) {
      results.push({ name: `${name}: MessageContent integration under StrictMode`, error: String(error) })
    } finally {
      flushSync(() => root.unmount())
      host.remove()
    }
  }
  return results
}

Object.assign(window, {
  __mathCopyVersions: { katex: katex.version },
  __mathCopyResults: run(),
  __mathCopyNative: (scenario: string) => nativeFixture(render, scenario),
  __mathCopyNativeResult: nativeResult,
})
