import { mathMLToText } from '../src/lib/mathText'
import { handleMathCopy, mathClipboard, registerMathCopy } from '../src/lib/mathCopy'

export interface Result { name: string; error?: string }
export type RenderMath = (latex: string, display?: boolean) => string
export type Test = (name: string, body: () => void) => void

export function equal(actual: unknown, expected: unknown) {
  if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
export function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message)
}

/** These tests run in a real DOM, not a mock of KaTeX's visual structure. */
export function runMathCopyCases(render: RenderMath, golden: { latex: string; expected: string; display?: boolean; source?: string }[]): Result[] {
  const results: Result[] = []
  const test: Test = (name, body) => {
    try { body(); results.push({ name }) }
    catch (error) { results.push({ name, error: String(error) }) }
    finally { document.getSelection()?.removeAllRanges(); document.getElementById('fixture')?.remove() }
  }
  const mount = (html: string) => {
    const host = document.createElement('div')
    host.id = 'fixture'
    host.innerHTML = html
    document.body.append(host)
    return host
  }
  const select = (element: Node, start?: [Node, number], end?: [Node, number]) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    if (start) range.setStart(...start)
    if (end) range.setEnd(...end)
    const selection = document.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    return selection
  }
  const copy = (host: HTMLElement, roots: HTMLElement[] = [host]) => {
    const payload = mathClipboard(document.getSelection()!, roots)
    check(payload, 'Expected a math clipboard payload')
    const html = document.createElement('div')
    html.innerHTML = payload.html
    check(!html.querySelector('.katex, math, annotation, svg, [aria-hidden], [data-math-copy]'), 'Renderer markup leaked into HTML')
    return { ...payload, parsed: html }
  }
  const x = () => render('x^2+y^2')
  const formulaText = (root: ParentNode) => root.querySelector('.katex-html .mord')!.firstChild!
  const event = () => new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })

  for (const fixture of golden) test(`math: ${fixture.source || fixture.latex}`, () => {
    const host = mount(render(fixture.latex, fixture.display))
    equal(mathMLToText(host.querySelector('math')!, fixture.display ?? false), fixture.expected)
    select(host)
    const payload = copy(host)
    equal(payload.text, fixture.expected)
    equal(payload.parsed.textContent?.replace(/\s+/g, ''), fixture.expected.replace(/\s+/g, ''))
  })

  test('inline prose, prime/subscript example and punctuation stay on one line', () => {
    const host = mount(`<p>The Euler equation is ${render("u'(c_t)=\\beta(1+r)u'(c_{t+1})")}, which describes the optimal intertemporal allocation.</p>`)
    select(host)
    equal(copy(host).text, 'The Euler equation is u′(cₜ) = β(1 + r)u′(cₜ₊₁), which describes the optimal intertemporal allocation.')
  })
  test('soft-wrapped prose collapses, explicit line breaks survive', () => {
    const host = mount(`<p>A soft\nwrap ${x()} ends.<br>Next line.</p>`)
    select(host)
    equal(copy(host).text, 'A soft wrap x² + y² ends.\nNext line.')
  })
  test('display and aligned equations preserve paragraphs without blank-line runs', () => {
    const host = mount(`<p>Before.</p>\n${render(String.raw`\begin{aligned}x&=1\\y&=2\end{aligned}`, true)}\n<p>After.</p>`)
    select(host)
    equal(copy(host).text, 'Before.\n\nx = 1\ny = 2\n\nAfter.')
  })
  test('display spans inside a paragraph remain block-level only in the clipboard', () => {
    const host = mount(`<p>Before ${render('x^2', true)} after.</p>`)
    select(host)
    const payload = copy(host)
    equal(payload.text, 'Before\nx²\nafter.')
    check(payload.parsed.querySelector('span[style="display: block;"]'), 'Missing display boundary in rich HTML')
  })
  test('headings, lists, links and formatting survive math copying', () => {
    const host = mount(`<h2>Condition ${render('x^2')}</h2><p><strong>Bold</strong> and <a href="https://example.com/course">a link</a>.</p><ul><li>First ${render('a_t')}</li><li>Second</li></ul>`)
    select(host)
    const payload = copy(host)
    equal(payload.text, 'Condition x²\n\nBold and a link.\n\n• First aₜ\n• Second')
    check(payload.parsed.querySelector('h2') && payload.parsed.querySelector('strong') && payload.parsed.querySelector('ul > li'), 'Semantic HTML lost')
    equal(payload.parsed.querySelector('a')?.href, 'https://example.com/course')
  })
  test('partial ordered list uses the original selected item number', () => {
    const host = mount(`<ol start="4"><li>Unselected</li><li>Second ${render('x^2')}</li><li>Third</li></ol>`)
    select(host.querySelectorAll('li')[1])
    const payload = copy(host)
    equal(payload.text, '5. Second x²')
    equal(payload.parsed.querySelector('ol')?.getAttribute('start'), '5')
  })
  test('reversed lists and explicit list-item values are retained', () => {
    const host = mount(`<ol reversed><li>One</li><li value="8">Two ${render('x^2')}</li><li>Three</li></ol>`)
    select(host, [host.querySelectorAll('li')[1].firstChild!, 0])
    equal(copy(host).text, '8. Two x²\n7. Three')
  })
  test('nested lists retain nesting and separate items', () => {
    const host = mount(`<ul><li>Outer ${render('x^2')}<ul><li>Inner</li></ul></li><li>Next</li></ul>`)
    select(host)
    const text = copy(host).text
    check(text.includes('• Outer x²') && text.includes('\n  • Inner') && text.endsWith('\n• Next'), text)
  })
  test('tables preserve cells, rows and math once in both formats', () => {
    const host = mount(`<table><thead><tr><th>State</th><th>Value</th></tr></thead><tbody><tr><td>${render('x_t')}</td><td>2</td></tr></tbody></table>`)
    select(host)
    const payload = copy(host)
    equal(payload.text, 'State\tValue\nxₜ\t2')
    equal(payload.parsed.querySelectorAll('td').length, 2)
  })
  test('code indentation and intentional blank lines survive beside math', () => {
    const host = mount(`<p>${x()}</p><pre><code>  const x = 2;\n\n\n    return x;\n</code></pre>`)
    select(host)
    equal(copy(host).text, 'x² + y²\n\n  const x = 2;\n\n\n    return x;\n')
  })
  test('partial surrounding words remain partial, not whole paragraphs', () => {
    const host = mount(`<p>prefix ${x()} suffix</p>`)
    const p = host.firstElementChild!
    select(p, [p.firstChild!, 3], [p.lastChild!, 4])
    equal(copy(host).text, 'fix x² + y² suf')
  })
  test('selection wholly inside the visual formula copies the complete expression once', () => {
    const host = mount(`<p>Before ${x()} after.</p>`)
    const text = formulaText(host)
    select(text, [text, 0], [text, 1])
    equal(copy(host).text, 'x² + y²')
  })
  test('selection starting in a formula excludes unselected preceding prose', () => {
    const host = mount(`<p>Before ${x()} after.</p>`)
    const p = host.firstElementChild!
    const text = formulaText(host)
    select(p, [text, 0])
    equal(copy(host).text, 'x² + y² after.')
  })
  test('selection ending inside a formula excludes unselected trailing prose', () => {
    const host = mount(`<p>Before ${x()} after.</p>`)
    const text = formulaText(host)
    select(host.firstElementChild!, undefined, [text, 1])
    equal(copy(host).text, 'Before x² + y²')
  })
  test('backward selections have the same output and are not moved', () => {
    const host = mount(`<p>Before ${x()} after.</p>`)
    const p = host.firstElementChild!
    const selection = document.getSelection()!
    selection.setBaseAndExtent(p.lastChild!, 7, p.firstChild!, 0)
    const anchor = selection.anchorNode
    const offset = selection.anchorOffset
    equal(copy(host).text, 'Before x² + y² after.')
    equal(selection.anchorNode, anchor)
    equal(selection.anchorOffset, offset)
  })
  test('a partial display selection keeps its entire multiline formula', () => {
    const host = mount(render(String.raw`\begin{aligned}x&=1\\y&=2\end{aligned}`, true))
    const text = formulaText(host)
    select(text, [text, 0], [text, 1])
    equal(copy(host).text, 'x = 1\ny = 2')
  })
  test('two equal formulas remain two separate occurrences', () => {
    const host = mount(`<p>${x()} and ${x()}</p>`)
    select(host)
    equal(copy(host).text, 'x² + y² and x² + y²')
  })
  test('one selection can cross multiple registered rendering roots', () => {
    const host = mount(`<article><div class="md"><p>Chat ${render('x^2')}</p></div><div class="md"><p>Lecture ${render('y^2')}</p></div></article>`)
    select(host)
    equal(copy(host, Array.from(host.querySelectorAll<HTMLElement>('.md'))).text, 'Chat x²\n\nLecture y²')
  })
  test('disjoint ranges expanded into the same formula do not duplicate it', () => {
    const host = mount(x())
    const text = formulaText(host)
    const a = document.createRange()
    a.setStart(text, 0); a.setEnd(text, 1)
    const b = a.cloneRange()
    // Chromium accepts only one real range; exercise the Firefox multi-range
    // contract with real DOM Ranges, without claiming Chromium added two.
    const selection = { rangeCount: 2, isCollapsed: false, anchorNode: text, focusNode: text, getRangeAt: (i: number) => i ? b : a }
    equal(mathClipboard(selection, [host])?.text, 'x² + y²')
  })
  test('disjoint ranges do not copy the intervening unselected prose', () => {
    const host = mount(`<p>${render('x^2')}</p><p>Not selected</p><p>${render('y^2')}</p>`)
    const a = document.createRange(), b = document.createRange()
    a.selectNodeContents(host.children[0]); b.selectNodeContents(host.children[2])
    const selection = { rangeCount: 2, isCollapsed: false, anchorNode: host, focusNode: host, getRangeAt: (i: number) => i ? b : a }
    equal(mathClipboard(selection, [host])?.text, 'x²\n\ny²')
  })
  test('no math selected means no custom payload or preventDefault', () => {
    const host = mount(`<p>Ordinary <strong>text</strong>.</p><p>${x()}</p>`)
    select(host.firstElementChild!)
    equal(mathClipboard(document.getSelection()!, [host]), null)
    const e = event()
    handleMathCopy(e, [host], document)
    equal(e.defaultPrevented, false)
    equal(e.clipboardData!.types.length, 0)
  })
  test('a range ending immediately before math does not include it', () => {
    const host = mount(`<p>Before ${x()} after</p>`)
    const p = host.firstElementChild!
    select(p, [p, 0], [p, 1])
    equal(mathClipboard(document.getSelection()!, [host]), null)
  })
  test('math outside registered course content does not intercept copy', () => {
    const host = mount(`<div>${x()}</div><div class="md">Ordinary</div>`)
    select(host.firstElementChild!)
    equal(mathClipboard(document.getSelection()!, [host.lastElementChild as HTMLElement]), null)
  })
  test('editable math and inputs keep native behavior', () => {
    const host = mount(`<div contenteditable="true">${x()}</div><textarea>ordinary text</textarea>`)
    select(host.firstElementChild!)
    equal(mathClipboard(document.getSelection()!, [host]), null)
    select(host)
    const input = host.querySelector('textarea')!
    input.focus(); input.select()
    const e = event()
    input.dispatchEvent(e)
    handleMathCopy(e, [host], document)
    equal(e.defaultPrevented, false)
  })
  test('missing clipboard data, empty and collapsed selections are no-ops', () => {
    const host = mount(x())
    select(host)
    const e = new ClipboardEvent('copy', { cancelable: true })
    handleMathCopy(e, [host], document)
    equal(e.defaultPrevented, false)
    document.getSelection()!.collapse(host, 0)
    equal(mathClipboard(document.getSelection()!, [host]), null)
    document.getSelection()!.removeAllRanges()
    equal(mathClipboard(document.getSelection()!, [host]), null)
  })
  test('a prior copy handler is respected', () => {
    const host = mount(x())
    select(host)
    const e = event()
    e.clipboardData!.setData('text/plain', 'other handler')
    e.preventDefault()
    handleMathCopy(e, [host], document)
    equal(e.clipboardData!.getData('text/plain'), 'other handler')
  })
  test('copy writes both clipboard formats, without changing DOM or selection', () => {
    const host = mount(`<p>Use ${x()}.</p>`)
    const stop = registerMathCopy(host)
    try {
      const selection = select(host)
      const before = host.innerHTML
      const range = selection.getRangeAt(0).cloneRange()
      const e = event()
      host.dispatchEvent(e)
      equal(e.defaultPrevented, true)
      equal(e.clipboardData!.getData('text/plain'), 'Use x² + y².')
      check(e.clipboardData!.getData('text/html').includes('x² + y²'), 'Missing rich-text math')
      equal(host.innerHTML, before)
      equal(selection.getRangeAt(0).compareBoundaryPoints(0, range), 0)
      equal(selection.getRangeAt(0).compareBoundaryPoints(2, range), 0)
    } finally { stop() }
  })
  test('HTML clipboard refusal falls back to clean plain text, not native math', () => {
    const host = mount(x())
    select(host)
    const e = event()
    const data = e.clipboardData!
    const setData = data.setData.bind(data)
    data.setData = (type, value) => {
      if (type === 'text/html') throw new DOMException('HTML unavailable')
      setData(type, value)
    }
    handleMathCopy(e, [host], document)
    equal(e.defaultPrevented, true)
    equal(data.getData('text/plain'), 'x² + y²')
    equal(data.getData('text/html'), '')
  })
  test('complete clipboard refusal does not break native copying', () => {
    const host = mount(x())
    select(host)
    const e = event()
    e.clipboardData!.setData = () => { throw new DOMException('Clipboard unavailable') }
    handleMathCopy(e, [host], document)
    equal(e.defaultPrevented, false)
  })
  test('listener lifetime supports multiple mounts, cleanup and remount', () => {
    const host = mount(`<div>${x()}</div><div>${render('y^2')}</div>`)
    const a = host.children[0] as HTMLElement, b = host.children[1] as HTMLElement
    const stopA = registerMathCopy(a), stopB = registerMathCopy(b)
    stopA(); stopA()
    select(b)
    const e = event(); b.dispatchEvent(e)
    equal(e.defaultPrevented, true)
    stopB()
    const after = event(); b.dispatchEvent(after)
    equal(after.defaultPrevented, false)
    const stopAgain = registerMathCopy(b)
    const again = event(); b.dispatchEvent(again)
    stopAgain()
    equal(again.defaultPrevented, true)
  })
  test('streamed/replaced formulas are read at copy time, not from a stale cache', () => {
    const host = mount(render('x^2'))
    const stop = registerMathCopy(host)
    try {
      host.innerHTML = render('x^3')
      select(host)
      const e = event(); host.dispatchEvent(e)
      equal(e.clipboardData!.getData('text/plain'), 'x³')
    } finally { stop() }
  })
  test('hidden text, decorative nodes and unsafe markup do not enter rich HTML', () => {
    const host = mount(`<p onclick="void 0" style="position:fixed">${x()}<span hidden>hidden</span><span aria-hidden="true">decorative</span><span style="display:none">secret</span><a href="javascript:void(0)">link</a></p><div class="message-footer">Copy reply</div>`)
    select(host)
    const payload = copy(host)
    equal(payload.text, 'x² + y²link')
    check(!payload.parsed.querySelector('[onclick], [href], [style]'), 'Unsafe attributes survived')
  })
  test('renderer errors keep one source expression and do not throw', () => {
    const host = mount(`<p>Invalid <span class="katex-error" title="Parse error">\\frac{</span>, valid ${render('x^2')}.</p>`)
    select(host)
    equal(copy(host).text, 'Invalid \\frac{, valid x².')
  })
  test('a hidden formula does not intercept an otherwise math-free selection', () => {
    const host = mount(`<p>Visible.</p><div hidden>${x()}</div>`)
    select(host)
    equal(mathClipboard(document.getSelection()!, [host]), null)
  })
  test('unsupported MathML wrappers use semantic children, not annotations', () => {
    const host = mount('<span class="katex"><span class="katex-mathml"><math><semantics><mrow><future-node><mi>x</mi><mo>+</mo><mi>y</mi></future-node></mrow><annotation encoding="application/x-tex">NEVER COPY TWICE</annotation></semantics></math></span><span class="katex-html">BAD VISUAL</span></span>')
    select(host)
    equal(copy(host).text, 'x + y')
  })
  test('damaged MathML falls back to one preserved source, not visual spans', () => {
    const host = mount('<span class="katex"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">x^2</annotation></semantics></math><span class="katex-html">BAD VISUAL</span></span>')
    select(host)
    equal(copy(host).text, 'x^2')
  })
  return results
}
