/**
 * Read KaTeX's public, semantic MathML, never its visual span/SVG layout or
 * internal parser. This is a clipboard representation, not a new math renderer.
 */
type Kind = 'atom' | 'operator' | 'sign' | 'open' | 'close' | 'punctuation' | 'function' | 'fraction' | 'space' | 'break' | 'text' | 'postfix' | 'bar'
interface Token { text: string; kind: Kind }
interface Context { multiline: boolean; fenced?: boolean; script?: boolean }

const SUPERSCRIPT: Record<string, string> = Object.fromEntries(Array.from('0123456789+-−=()inabcdefghijklmnoprstuvwxyz').map((c, i) => [c, Array.from('⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾ⁱⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ')[i]]))
Object.assign(SUPERSCRIPT, Object.fromEntries(Array.from('ABDEGHIJKLMNOPRTUVW').map((c, i) => [c, Array.from('ᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ')[i]])))
const SUBSCRIPT: Record<string, string> = Object.fromEntries(Array.from('0123456789+-−=()aehijklmnoprstuvxβγρφχ').map((c, i) => [c, Array.from('₀₁₂₃₄₅₆₇₈₉₊₋₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ')[i]]))
const FUNCTIONS = /^(?:sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|lg|exp|lim|limsup|liminf|max|min|sup|inf|arg|det|dim|gcd|Pr|trace|diag)$/
const BIG_OPERATORS = /^[∑∏∐∫∬∭∮∯∰⋃⋂⋁⋀]$/u
const BINARY = /^[=<>≤≥≠≈≃≅≡∼≲≳≪≫∝∈∉∋∌⊂⊃⊆⊇⊊⊋∪∩∖×⋅·÷/∗∘⊕⊗∧∨→←↔⇒⇐⇔↦⟶⟵⟷⟹⟸⟺↑↓↗↘⊥∣∥:≔≕]$/u
const IGNORED = new Set(['annotation', 'annotation-xml', 'mphantom', 'none', 'mprescripts'])
const GROUPS = new Set(['math', 'mrow', 'mstyle', 'mpadded', 'mtd', 'mtr'])
const clean = (text: string) => text.replace(/[\u00a0\u2000-\u200b\u202f\u205f]/g, ' ').replace(/[\u2061-\u2064\ufeff]/g, '')
const token = (text: string, kind: Kind = 'atom'): Token[] => text ? [{ text, kind }] : []
const children = (node: Element) => Array.from(node.children)

/** Only complete, representable scripts are converted; never mix levels. */
function script(text: string, superscript: boolean, source?: Element): string {
  if (!text) return ''
  if (superscript && /^[′″‴⁗]+$/.test(text)) return text
  if (superscript && text === '∗') return '^(*)'
  const mapping = superscript ? SUPERSCRIPT : SUBSCRIPT
  const compact = text.replace(/ /g, '')
  const words = source && [ ...(source.localName === 'mtext' ? [source] : []), ...Array.from(source.querySelectorAll('mtext')) ].some((n) => /\S\s+\S/.test(clean(n.textContent || '')))
  if (!words && Array.from(compact).every((c) => mapping[c])) return Array.from(compact).map((c) => mapping[c]).join('')
  return `${superscript ? '^' : '_'}(${text})`
}

function variant(text: string, name: string | null): string {
  // Blackboard and calligraphic letters can distinguish sets from scalars.
  // Other typographic styles are deliberately left as ordinary letters.
  const holes: Record<string, string> = name === 'double-struck'
    ? { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
    : { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }
  if (name !== 'double-struck' && name !== 'script') return text
  return Array.from(text).map((c) => {
    if (holes[c]) return holes[c]
    if (/^[A-Z]$/.test(c)) return String.fromCodePoint((name === 'script' ? 0x1d49c : 0x1d538) + c.charCodeAt(0) - 65)
    if (/^[a-z]$/.test(c)) return String.fromCodePoint((name === 'script' ? 0x1d4b6 : 0x1d552) + c.charCodeAt(0) - 97)
    return c
  }).join('')
}

function operator(text: string): Token[] {
  const arrows: Record<string, string> = { '⟶': '→', '⟵': '←', '⟷': '↔', '⟹': '⇒', '⟸': '⇐', '⟺': '⇔', '⟼': '↦', '⋅': '·' }
  text = arrows[text] || text
  if (/^[+−±∓]$/.test(text)) return token(text, 'sign')
  if (BINARY.test(text)) return token(text, 'operator')
  if (BIG_OPERATORS.test(text) || /^[∀∃∄]$/.test(text)) return token(text, 'function')
  if (/^[([{⟨⌊⌈]$/.test(text)) return token(text, 'open')
  if (/^[)\]}⟩⌋⌉]$/.test(text)) return token(text, 'close')
  if (/^[.!?]$/.test(text)) return token(text, text === '.' ? 'punctuation' : 'postfix')
  if (/^[,;]$/.test(text)) return token(text, 'punctuation')
  return token(text)
}

/** Spacing applies to semantic operators, not arbitrary characters in \text. */
function join(tokens: Token[]): string {
  let out = ''
  let previous: Kind | undefined
  const bars: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const { text } = tokens[i]
    let { kind } = tokens[i]
    if (kind === 'bar') {
      const opening = bars.at(-1) !== text || !previous || ['operator', 'sign', 'open', 'punctuation'].includes(previous)
      if (opening) bars.push(text)
      else bars.pop()
      kind = opening ? 'open' : 'close'
    }
    const space = () => { if (out && !/\s$/.test(out)) out += ' ' }
    if (kind === 'space') { space(); continue }
    if (kind === 'break') { out = out.trimEnd() + '\n'; previous = undefined; continue }
    if (kind === 'operator' || (kind === 'sign' && previous && !['operator', 'sign', 'open', 'punctuation', 'text', 'function'].includes(previous))) {
      space(); out += text + ' '
    } else if (kind === 'punctuation') {
      out = out.trimEnd() + text + ' '
    } else {
      if (previous === 'function' && kind !== 'open' && kind !== 'close') space()
      if (kind === 'function' && previous && ['atom', 'close', 'fraction'].includes(previous)) space()
      // Linear fractions need an explicit product at juxtaposition. A following
      // parenthesis may be an evaluation point, so group rather than invent ×.
      if ((previous === 'fraction' && ['atom', 'fraction'].includes(kind)) || (kind === 'fraction' && previous && ['atom', 'close'].includes(previous))) {
        space(); out += '· '
      }
      out += kind === 'fraction' && ['open', 'postfix'].includes(tokens[i + 1]?.kind) ? `(${text})` : text
    }
    previous = kind
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
}

function grouped(text: string): boolean {
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
  if (!pairs[text[0]] || text.at(-1) !== pairs[text[0]]) return false
  const stack: string[] = []
  for (let i = 0; i < text.length; i++) {
    if (pairs[text[i]]) stack.push(pairs[text[i]])
    else if (Object.values(pairs).includes(text[i]) && stack.pop() !== text[i]) return false
    if (!stack.length && i < text.length - 1) return false
  }
  return !stack.length
}

function operand(text: string): string {
  // A single symbol with scripts, a number, or an already fenced expression.
  return /^(?:[∂d][\p{L}][\p{M}₀-₎]*|\d+(?:\.\d+)?|[\p{L}∂∇][\p{M}⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵃ-ᶿ₀-₎′″‴]*)$/u.test(text) || grouped(text) ? text : `(${text})`
}

function read(node: Element, ctx: Context): Token[] {
  const name = node.localName.toLowerCase()
  if (IGNORED.has(name)) return []
  const cs = children(node)
  const inner = (n: Element | undefined, context: Context = ctx) => n ? join(read(n, context)) : ''
  if (name === 'semantics') return cs[0] ? read(cs[0], ctx) : []
  if (name === 'maction') {
    const selected = cs[Number(node.getAttribute('selection') || 1) - 1] || cs[0]
    return selected ? read(selected, ctx) : []
  }
  if (name === 'mtext' || name === 'ms') {
    const text = clean(node.textContent || '')
    return token(text, text.trim() ? 'text' : 'space')
  }
  if (name === 'mi' || name === 'mn') {
    const text = variant(clean(node.textContent || ''), node.getAttribute('mathvariant'))
    if (/^[∣∥]$/.test(text)) return token(text, 'bar')
    if (BINARY.test(text) || /^[∀∃∄.!?]$/.test(text)) return operator(text)
    return token(text, FUNCTIONS.test(text) ? 'function' : 'atom')
  }
  if (name === 'mo') {
    if (cs.length) return cs.flatMap((n) => read(n, ctx))
    return operator(clean(node.textContent || ''))
  }
  if (name === 'mspace') {
    if (node.getAttribute('linebreak') === 'newline') return token(ctx.multiline ? '\n' : ' ', ctx.multiline ? 'break' : 'space')
    return parseFloat(node.getAttribute('width') || '0') > 0 ? token(' ', 'space') : []
  }
  if (name === 'msub' || name === 'msup' || name === 'msubsup') {
    const baseTokens = cs[0] ? read(cs[0], ctx) : []
    const base = join(baseTokens)
    const kind = baseTokens.length === 1 && baseTokens[0].kind === 'function' ? 'function' : 'atom'
    const body = baseTokens.length > 1 && kind !== 'function' ? operand(base) : base
    const sub = name !== 'msup' ? script(inner(cs[1], { multiline: false, script: true }), false, cs[1]) : ''
    const supNode = cs[name === 'msubsup' ? 2 : 1]
    const sup = name !== 'msub' ? script(inner(supNode, { multiline: false, script: true }), true, supNode) : ''
    return token(`${baseTokens[0]?.kind === 'fraction' ? operand(body) : body}${sub}${sup}`, kind)
  }
  if (name === 'mfrac') {
    const top = inner(cs[0], { multiline: false })
    const bottom = inner(cs[1], { multiline: false })
    if (/^0(?:[a-z%]+)?$/.test(node.getAttribute('linethickness') || '')) return token(`stack(${top}; ${bottom})`)
    if (/^[d∂][⁰¹²³⁴⁵⁶⁷⁸⁹]*$/.test(top) && /^[d∂]/.test(bottom)) return token(`(${top}/${operand(bottom)})`)
    return token(`${operand(top)}/${operand(bottom)}`, 'fraction')
  }
  if (name === 'msqrt') return token(`√(${join(cs.flatMap((n) => read(n, { multiline: false })))})`)
  if (name === 'mroot') return token(`root(${inner(cs[1])}, ${inner(cs[0])})`)
  if (name === 'mover' || name === 'munder' || name === 'munderover') {
    const baseTokens = cs[0] ? read(cs[0], ctx) : []
    const base = join(baseTokens)
    const mark = inner(cs[1], { multiline: false, script: true })
    const above = name === 'mover'
    const accents: Record<string, [string, string]> = above
      ? { '^': ['\u0302', 'hat'], '~': ['\u0303', 'tilde'], '˜': ['\u0303', 'tilde'], 'ˉ': ['\u0304', 'bar'], '‾': ['\u0304', 'bar'], '˙': ['\u0307', 'dot'], '¨': ['\u0308', 'ddot'], '⃗': ['\u20d7', 'vec'], '→': ['\u20d7', 'vec'], '´': ['\u0301', 'acute'], '`': ['\u0300', 'grave'] }
      : { '‾': ['\u0332', 'underline'], '_': ['\u0332', 'underline'] }
    if (accents[mark] && (node.hasAttribute('accent') || node.hasAttribute('accentunder'))) {
      const [combining, fallback] = accents[mark]
      return token(/^[\p{L}\p{N}]\p{M}*$/u.test(base) ? base + combining : `${fallback}(${base})`)
    }
    const baseChildren = cs[0] ? children(cs[0]) : []
    if (['⏟', '⏞'].includes(baseChildren[1]?.textContent || '')) return token(`${operand(inner(baseChildren[0]))} [${mark}]`)
    if (mark === '⏟' || mark === '⏞') return token(operand(base))
    const kind = baseTokens.length === 1 ? baseTokens[0].kind : 'atom'
    if (kind === 'function') {
      const under = name !== 'mover' ? script(mark, false, cs[1]) : ''
      const over = name !== 'munder' ? script(inner(cs[name === 'munderover' ? 2 : 1], { multiline: false, script: true }), true) : ''
      return token(base + under + over, 'function')
    }
    // Non-accent annotations are not silently mistaken for powers/indices.
    if (name === 'munderover') return token(`${operand(base)} [below: ${mark}; above: ${inner(cs[2])}]`)
    return token(`${base} [${above ? 'above' : 'below'}: ${mark}]`, kind === 'operator' ? 'operator' : 'atom')
  }
  if (name === 'mtable') {
    // KaTeX encodes align/gather with zero inter-column spacing. Separate
    // columns with spaces and rows with newlines without adding punctuation.
    const equation = (node.getAttribute('columnspacing') || '').split(/\s+/).some((s) => /^0(?:em|px)?$/.test(s)) || node.getAttribute('width') === '100%'
    const rows = cs.map((row) => children(row)
      .filter((cell) => !cell.classList.contains('mtr-glue'))
      .map((cell) => inner(cell, { multiline: equation && node.getAttribute('width') === '100%' && ctx.multiline }))
      .filter(Boolean).join(' ')).filter(Boolean)
    const text = rows.join('\n')
    return token(equation || ctx.fenced || ctx.script ? text : `[${text}]`)
  }
  if (name === 'mfenced') {
    const separators = node.getAttribute('separators') ?? ','
    return token((node.getAttribute('open') ?? '(') + cs.map((n) => inner(n, { ...ctx, multiline: false })).join(separators ? separators[0] + ' ' : ' ') + (node.getAttribute('close') ?? ')'))
  }
  if (name === 'menclose') {
    const text = join(cs.flatMap((n) => read(n, ctx)))
    return token((node.getAttribute('notation') || '').includes('strike') ? `cancel(${text})` : text)
  }
  if (GROUPS.has(name)) {
    const fenced = name === 'mrow' && cs.some((n) => n.localName === 'mtable') && cs.some((n) => n.getAttribute('fence') === 'true')
    // Binomial fences are already expressed by binom(n, k).
    if (cs.length === 3 && cs[0].textContent === '(' && cs[1].localName === 'mfrac' && /^0(?:[a-z%]+)?$/.test(cs[1].getAttribute('linethickness') || '') && cs[2].textContent === ')') return token(`binom(${inner(cs[1].children[0])}, ${inner(cs[1].children[1])})`)
    if (name === 'mrow' && cs.length === 1 && cs[0].textContent === ',') return token(',')
    const result: Token[] = []
    for (const child of cs) {
      if (child.localName === 'mo' && child.textContent === '\u2061') {
        const last = result.at(-1)
        if (last) last.kind = 'function'
      } else if (child.getAttribute('fence') === 'true' && (child === cs[0] || child === cs.at(-1))) {
        result.push({ text: clean(child.textContent || ''), kind: child === cs[0] ? 'open' : 'close' })
      } else result.push(...read(child, fenced ? { ...ctx, fenced: true } : ctx))
    }
    // A cases environment has an opening brace and intentionally no closing one.
    if (fenced && cs[0].textContent === '{' && cs.at(-1)?.localName === 'mtable') result.push({ text: '}', kind: 'close' })
    return result
  }
  // Future MathML containers retain their semantic children, never annotations.
  return cs.length ? cs.flatMap((n) => read(n, ctx)) : token(clean(node.textContent || ''))
}

export function mathMLToText(math: Element, display = math.getAttribute('display') === 'block'): string {
  return join(read(math, { multiline: display }))
}
