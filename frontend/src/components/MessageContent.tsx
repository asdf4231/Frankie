/**
 * MessageContent
 *
 * 渲染 LLM 返回的消息内容：
 * 1. 将 [[页面路径|显示名称]] 替换为行内角标 [1][2]...，hover 时显示标题 tooltip
 * 2. 渲染完整 Markdown（加粗、列表、代码块等）
 * 3. 气泡底部引用列表：编号 + 标题，点击调用 onOpenRef
 *
 * 组件经 memo 包裹：Markdown 解析和 KaTeX 渲染都在 render 中同步进行，
 * 只有 content / streaming / onOpenRef 变化时才重新渲染。调用方必须传入稳定的 onOpenRef。
 */

import { memo, useMemo } from 'react'
import ReactMarkdown, { type Components, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import './Markdown.css'

const REMARK_PLUGINS: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkMath]
// 只输出 HTML：默认还会为每个公式额外生成一份隐藏的 MathML，DOM 体积翻倍。
const REHYPE_PLUGINS: NonNullable<Options['rehypePlugins']> = [[rehypeKatex, { output: 'html' }]]
const REMARK_REHYPE_OPTIONS: Options['remarkRehypeOptions'] = { allowDangerousHtml: true }

interface Ref {
  index: number
  target: string
  title: string
}

interface Props {
  content: string
  streaming?: boolean
  onOpenRef?: (target: string) => void
}

function referenceTitle(target: string): string {
  let name = target.split(/[?#]/, 1)[0]
  try { name = decodeURIComponent(name) } catch { /* 保留未编码的名称 */ }
  name = name.replace(/\\/g, '/').split('/').pop() || name
  name = name.replace(/\.(md|txt)$/i, '')
  const lecture = name.match(/^lecture[-_\s]*(\d+)$/i)
  return lecture ? `Lecture ${lecture[1].padStart(2, '0')}` : name.replace(/[_-]+/g, ' ')
}

/** 按链接目标去重；显示名称与导航目标分开保存。 */
function extractRefs(text: string): Ref[] {
  const seen = new Map<string, Ref>()
  const pattern = /\[\[([^\]]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const [target, label] = match[1].split('|', 2).map((part) => part.trim())
    if (!seen.has(target)) {
      seen.set(target, { index: seen.size + 1, target, title: label || referenceTitle(target) })
    }
  }
  return Array.from(seen.values())
}

/** 编号占位符不包含路径或显示名称，避免干扰 Markdown 解析。 */
function replaceWikiLinks(text: string, refMap: Map<string, number>): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, reference: string) => {
    const target = reference.split('|', 1)[0].trim()
    const idx = refMap.get(target)
    return idx !== undefined ? `%%REF:${idx}%%` : reference
  })
}

function MessageContent({ content, streaming, onOpenRef }: Props) {
  const { refs, processedText } = useMemo(() => {
    const refs = extractRefs(content)
    const refMap = new Map(refs.map((r) => [r.target, r.index]))
    const processedText = replaceWikiLinks(content, refMap)
    return { refs, processedText }
  }, [content])

  const components = useMemo<Components>(() => ({
    a({ children, href }) {
      return (
        <a
          href={href}
          onClick={(event) => {
            if (href && /^(https?:|mailto:|\/\/)/i.test(href)) return
            event.preventDefault()
            const label = String(children)
            onOpenRef?.(href || label)
          }}
        >
          {children}
        </a>
      )
    },
    // 把编号占位符渲染为角标。
    p({ children }) {
      return <p>{renderWithRefs(children, refs, onOpenRef)}</p>
    },
    li({ children }) {
      return <li>{renderWithRefs(children, refs, onOpenRef)}</li>
    },
    h1({ children }) {
      return <h1>{renderWithRefs(children, refs, onOpenRef)}</h1>
    },
    h2({ children }) {
      return <h2>{renderWithRefs(children, refs, onOpenRef)}</h2>
    },
    h3({ children }) {
      return <h3>{renderWithRefs(children, refs, onOpenRef)}</h3>
    },
    td({ children }) {
      return <td>{renderWithRefs(children, refs, onOpenRef)}</td>
    },
    blockquote({ children }) {
      return <blockquote>{renderWithRefs(children, refs, onOpenRef)}</blockquote>
    },
  }), [refs, onOpenRef])

  return (
    <div className="message-content">
      {/* ── Markdown 区域 ───────────────────────── */}
      <div className={`md${streaming ? ' is-streaming' : ''}`}>
        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={REHYPE_PLUGINS}
          remarkRehypeOptions={REMARK_REHYPE_OPTIONS}
          components={components}
        >
          {processedText}
        </ReactMarkdown>
      </div>

      {/* ── 引用列表 ─────────────────────────────── */}
      {refs.length > 0 && !streaming && (
        <>
          <div className="ref-divider" />
          <div className="ref-list">
            {refs.map((r) => (
              <button
                key={r.index}
                className="ref-item"
                onClick={() => onOpenRef?.(r.target)}
                title={`打开 ${r.title}`}
              >
                <span className="ref-badge">{r.index}</span>
                <span className="ref-title">{r.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default memo(MessageContent)

// ── 工具函数：递归把 React children 里的占位符替换为角标 ──────────

function renderWithRefs(
  children: React.ReactNode,
  refs: Ref[],
  onOpenRef?: (target: string) => void,
): React.ReactNode {
  if (typeof children === 'string') {
    return splitByRefs(children, refs, onOpenRef)
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => (
      <span key={i}>{renderWithRefs(child, refs, onOpenRef)}</span>
    ))
  }
  return children
}

function splitByRefs(
  text: string,
  refs: Ref[],
  onOpenRef?: (target: string) => void,
): React.ReactNode {
  const parts = text.split(/(%%REF:\d+%%)/g)
  return parts.map((part, i) => {
    const m = part.match(/^%%REF:(\d+)%%$/)
    const ref = m ? refs[Number(m[1]) - 1] : undefined
    if (ref) {
      return (
        <button
          key={i}
          type="button"
          className="wiki-ref"
          title={`打开 ${ref.title}`}
          onClick={() => onOpenRef?.(ref.target)}
        >
          {ref.index}
        </button>
      )
    }
    return part
  })
}
