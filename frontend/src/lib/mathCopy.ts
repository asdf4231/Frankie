import { mathMLToText } from './mathText'

export interface MathClipboard { text: string; html: string }

const MATH = '.katex-display, .katex, .katex-error'
const SKIP = 'script, style, template, noscript, svg, [hidden], [inert], [aria-hidden="true"], .visually-hidden, .sr-only, .message-footer, .md-caret'
const SAFE_TAGS = new Set('a abbr b blockquote br caption code dd del div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img kbd li mark ol p pre s section small span strong sub sup table tbody td tfoot th thead tr u ul'.split(' '))
const BLOCKS = new Set('blockquote div dl dt dd figure figcaption h1 h2 h3 h4 h5 h6 p pre section'.split(' '))
const MATH_ATTRIBUTE = 'data-math-copy'
const asElement = (node: Node | null): Element | null => node?.nodeType === 1 ? node as Element : node?.parentElement ?? null

/** Compare points explicitly; Range's END_TO_START names are easy to invert. */
function comparePoints(document: Document, a: Node, ao: number, b: Node, bo: number): number {
  const left = document.createRange()
  const right = document.createRange()
  left.setStart(a, ao)
  left.collapse(true)
  right.setStart(b, bo)
  right.collapse(true)
  return left.compareBoundaryPoints(0, right)
}

function overlaps(range: Range, node: Node): boolean {
  const bounds = node.ownerDocument!.createRange()
  bounds.selectNodeContents(node)
  return comparePoints(node.ownerDocument!, range.endContainer, range.endOffset, bounds.startContainer, bounds.startOffset) > 0
    && comparePoints(node.ownerDocument!, range.startContainer, range.startOffset, bounds.endContainer, bounds.endOffset) < 0
}

function visible(element: Element): boolean {
  if (element.matches(SKIP)) return false
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  return style?.display !== 'none' && style?.visibility !== 'hidden' && style?.visibility !== 'collapse' && style?.userSelect !== 'none'
}

function editable(node: Node | null): boolean {
  const element = asElement(node)
  return !!element && (!!element.closest('input, textarea, select') || (element as HTMLElement).isContentEditable)
}

function readFormula(element: Element): string {
  const math = element.querySelector('math')
  if (math) {
    try {
      const text = mathMLToText(math, element.matches('.katex-display'))
      if (text) return text
    } catch {
      // Malformed/unsupported trees must not break the user's copy operation.
    }
  }
  // A renderer error or damaged MathML keeps one source expression. It is safer
  // to show the source than silently drop content or read visual layout spans.
  return element.querySelector('annotation[encoding="application/x-tex"]')?.textContent
    || (element.matches('.katex-error') ? element.textContent : null)
    || '[unavailable math]'
}

function safeUrl(element: Element, attribute: 'href' | 'src'): string | null {
  const value = element.getAttribute(attribute)
  if (!value) return null
  try {
    const url = new URL(value, element.ownerDocument.baseURI)
    if (['https:', 'http:'].includes(url.protocol) || (attribute === 'href' && ['mailto:', 'tel:'].includes(url.protocol))) return url.href
    if (attribute === 'src' && /^data:image\/(?:png|gif|jpe?g|webp|avif);/i.test(value)) return value
  } catch { /* An invalid URL should not invalidate the selected prose. */ }
  return null
}

function itemNumber(item: Element): number {
  const list = item.parentElement!
  const items = Array.from(list.children).filter((child) => child.localName === 'li')
  const step = list.hasAttribute('reversed') ? -1 : 1
  let number = Number(list.getAttribute('start') ?? (step < 0 ? items.length : 1))
  for (const child of items) {
    if (child.hasAttribute('value')) number = Number(child.getAttribute('value'))
    if (child === item) return number
    number += step
  }
  return number
}

/** Create only selected, safe HTML. The live DOM and actual selection are never changed. */
function copyNode(node: Node, range: Range, formulas: Set<Element>, values: Map<Element, string>): Node | null {
  if (!overlaps(range, node)) return null
  const document = node.ownerDocument!
  if (node.nodeType === 3) {
    const start = range.startContainer === node ? range.startOffset : 0
    const end = range.endContainer === node ? range.endOffset : node.textContent!.length
    return document.createTextNode(node.textContent!.slice(start, end))
  }
  if (node.nodeType !== 1) return null
  const element = node as Element
  if (formulas.has(element)) {
    let text = values.get(element)
    if (text === undefined) { text = readFormula(element); values.set(element, text) }
    const replacement = document.createElement('span')
    const display = element.matches('.katex-display')
    replacement.setAttribute(MATH_ATTRIBUTE, display ? 'display' : 'inline')
    // A span with display:block is valid even inside a Markdown paragraph.
    if (display) replacement.style.display = 'block'
    text.split(/\r?\n/).forEach((line, index) => {
      if (index) replacement.append(document.createElement('br'))
      replacement.append(document.createTextNode(line))
    })
    return replacement
  }
  if (!visible(element)) return null
  if (element.localName === 'input') {
    return (element as HTMLInputElement).type === 'checkbox'
      ? document.createTextNode((element as HTMLInputElement).checked ? '[x] ' : '[ ] ')
      : null
  }
  const name = SAFE_TAGS.has(element.localName) ? element.localName : 'span'
  const clone = document.createElement(name)
  for (const attribute of ['title', 'lang', 'dir']) {
    if (element.hasAttribute(attribute)) clone.setAttribute(attribute, element.getAttribute(attribute)!)
  }
  if (name === 'a' || name === 'img') {
    const attribute = name === 'a' ? 'href' : 'src'
    const url = safeUrl(element, attribute)
    if (url) clone.setAttribute(attribute, url)
    if (name === 'img') clone.setAttribute('alt', element.getAttribute('alt') || '')
  }
  for (const attribute of name === 'ol' ? ['start', 'reversed', 'type'] : name === 'li' ? ['value'] : ['td', 'th'].includes(name) ? ['colspan', 'rowspan'] : []) {
    if (element.hasAttribute(attribute)) clone.setAttribute(attribute, element.getAttribute(attribute)!)
  }
  let firstItem = true
  for (const child of Array.from(node.childNodes)) {
    const copied = copyNode(child, range, formulas, values)
    if (copied) {
      if (name === 'ol' && asElement(child)?.localName === 'li' && firstItem) {
        clone.setAttribute('start', String(itemNumber(child as Element)))
        firstItem = false
      }
      clone.append(copied)
    }
  }
  return clone.hasChildNodes() || ['br', 'hr', 'img'].includes(name) ? clone : null
}

/** A pending boundary avoids multiplying newlines at nested block boundaries. */
class TextFlow {
  private value = ''
  private boundary = 0
  private literal = false

  break(lines = 1) { this.boundary = Math.max(this.boundary, lines) }

  append(text: string, literal = false) {
    if (!text) return
    if (!literal) text = text.replace(/[\t\r\n\f \u00a0]+/g, ' ')
    if (this.boundary) {
      if (!literal) text = text.trimStart()
      if (!text) return
      if (!this.literal) this.value = this.value.trimEnd()
      if (this.value) {
        const trailing = this.value.match(/\n*$/)![0].length
        this.value += '\n'.repeat(Math.max(0, this.boundary - trailing))
      }
      this.boundary = 0
    }
    if (!literal && !this.literal && this.value.endsWith(' ') && text.startsWith(' ')) text = text.slice(1)
    this.value += text
    this.literal = literal
  }

  finish() { return this.literal ? this.value : this.value.trimEnd() }
}

function plainText(node: Node): string {
  const flow = new TextFlow()
  const visit = (n: Node) => {
    if (n.nodeType === 3) { flow.append(n.textContent || ''); return }
    if (n.nodeType !== 1 && n.nodeType !== 11) return
    const element = n.nodeType === 1 ? n as Element : null
    const name = element?.localName
    if (name === 'br') { flow.break(); return }
    if (name === 'hr') { flow.break(2); return }
    if (name === 'img') { flow.append(element!.getAttribute('alt') || ''); return }
    if (name === 'pre') {
      flow.break(2); flow.append(n.textContent || '', true); flow.break(2); return
    }
    if (name === 'ul' || name === 'ol') {
      flow.break(2)
      let number = Number(element!.getAttribute('start') || 1)
      const step = element!.hasAttribute('reversed') ? -1 : 1
      for (const item of Array.from(element!.children)) {
        if (item.localName !== 'li') continue
        if (item.hasAttribute('value')) number = Number(item.getAttribute('value'))
        const marker = name === 'ol' ? `${number}. ` : '• '
        const text = plainText(item)
        flow.append(marker + text.replace(/\n/g, '\n' + ' '.repeat(marker.length)), true)
        flow.break()
        number += step
      }
      flow.break(2); return
    }
    if (name === 'table') {
      flow.break(2)
      for (const row of Array.from(element!.querySelectorAll('tr')).filter((row) => row.closest('table') === element)) {
        flow.append(Array.from(row.children).map((cell) => plainText(cell)).join('\t'), true)
        flow.break()
      }
      flow.break(2); return
    }
    const math = element?.getAttribute(MATH_ATTRIBUTE)
    const block = !!name && BLOCKS.has(name)
    if (block || math === 'display') flow.break(math ? 1 : 2)
    Array.from(n.childNodes).forEach(visit)
    if (block || math === 'display') flow.break(math ? 1 : 2)
  }
  visit(node)
  return flow.finish()
}

/**
 * Returns null for math-free selections: the browser retains its native copy
 * behavior, formatting and editor handling. Overlapping expanded ranges merge
 * by DOM position, never by formula text (two identical equations are two occurrences).
 */
export function mathClipboard(selection: Pick<Selection, 'rangeCount' | 'isCollapsed' | 'anchorNode' | 'focusNode' | 'getRangeAt'>, roots: Iterable<HTMLElement>): MathClipboard | null {
  if (!selection.rangeCount || selection.isCollapsed || editable(selection.anchorNode) || editable(selection.focusNode)) return null
  const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()).filter((r) => !r.collapsed)
  if (!ranges.length) return null
  const start = ranges[0].startContainer
  const document = start.nodeType === 9 ? start as Document : start.ownerDocument!
  const activeRoots = Array.from(roots).filter((root) => root.isConnected && root.ownerDocument === document)
  const formulas = new Set<Element>()
  const visibility = new Map<Element, boolean>()
  const selectable = (node: Element | null): boolean => {
    if (!node) return true
    const cached = visibility.get(node)
    if (cached !== undefined) return cached
    const value = visible(node) && selectable(node.parentElement)
    visibility.set(node, value)
    return value
  }
  for (const root of activeRoots) {
    if (!ranges.some((range) => overlaps(range, root))) continue
    for (const element of Array.from(root.querySelectorAll(MATH))) {
      if (element.parentElement?.closest(MATH)) continue
      if (ranges.some((range) => overlaps(range, element)) && selectable(element)) formulas.add(element)
    }
  }
  if (!formulas.size) return null
  for (const range of ranges) {
    for (const formula of formulas) {
      if (formula.contains(range.startContainer)) range.setStartBefore(formula)
      if (formula.contains(range.endContainer)) range.setEndAfter(formula)
    }
  }
  ranges.sort((a, b) => a.compareBoundaryPoints(0, b))
  const merged: Range[] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && comparePoints(document, last.endContainer, last.endOffset, range.startContainer, range.startOffset) >= 0) {
      if (comparePoints(document, last.endContainer, last.endOffset, range.endContainer, range.endOffset) < 0) last.setEnd(range.endContainer, range.endOffset)
    } else merged.push(range)
  }
  const fragments: HTMLElement[] = []
  const values = new Map<Element, string>()
  for (const range of merged) {
    // Include the selected content's list/heading/pre context, but no unselected
    // siblings. This also recovers the formula root from a deeply nested endpoint.
    const root = activeRoots.find((r) => r.contains(range.commonAncestorContainer)) || (range.commonAncestorContainer.nodeType === 9 ? document.documentElement : asElement(range.commonAncestorContainer))
    if (!root) continue
    const content = copyNode(root, range, formulas, values)
    if (content) {
      const container = document.createElement('div')
      container.append(content)
      fragments.push(container)
    }
  }
  if (!fragments.length) return null
  const text = fragments.map(plainText).join('\n\n')
  // Keep only the structural style for display math, not private data or any
  // renderer HTML/MathML. Rich-text destinations receive the same Unicode text.
  for (const fragment of fragments) {
    fragment.querySelectorAll(`[${MATH_ATTRIBUTE}]`).forEach((n) => n.removeAttribute(MATH_ATTRIBUTE))
  }
  return { text, html: fragments.map((fragment) => fragment.innerHTML).join('<br><br>') }
}

export function handleMathCopy(event: ClipboardEvent, roots: Iterable<HTMLElement>, document: Document): void {
  if (event.defaultPrevented || !event.clipboardData || document.designMode === 'on' || editable(event.target as Node) || editable(document.activeElement)) return
  const selection = document.getSelection()
  if (!selection) return
  try {
    const payload = mathClipboard(selection, roots)
    if (!payload) return
    event.clipboardData.clearData()
    event.clipboardData.setData('text/plain', payload.text)
    try {
      event.clipboardData.setData('text/html', payload.html)
    } catch {
      // If HTML is refused, keep the clean plain-text payload rather than let
      // native copying reintroduce the original dual math representations.
      try { event.clipboardData.clearData('text/html') } catch { /* Already cleared above. */ }
    }
    event.preventDefault()
  } catch {
    // Native copying remains available when a range goes stale or the browser
    // refuses clipboard data. Do not swallow the user's copy command.
  }
}

const documents = new WeakMap<Document, { roots: Set<HTMLElement>; listener: (event: ClipboardEvent) => void }>()

/** One document listener covers selections across multiple mounted messages. */
export function registerMathCopy(root: HTMLElement): () => void {
  const document = root.ownerDocument
  let entry = documents.get(document)
  if (!entry) {
    const roots = new Set<HTMLElement>()
    entry = { roots, listener: (event) => handleMathCopy(event, roots, document) }
    documents.set(document, entry)
    document.addEventListener('copy', entry.listener)
  }
  entry.roots.add(root)
  let registered = true
  return () => {
    if (!registered) return
    registered = false
    entry.roots.delete(root)
    if (!entry.roots.size) {
      document.removeEventListener('copy', entry.listener)
      documents.delete(document)
    }
  }
}
