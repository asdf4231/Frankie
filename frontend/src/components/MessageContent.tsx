/**
 * MessageContent
 *
 * 渲染 LLM 返回的消息内容：
 * 1. 将 [[页面路径|显示名称]] 替换为行内角标 [1][2]...，hover 时显示标题 tooltip
 * 2. 渲染完整 Markdown（加粗、列表、代码块等）
 * 3. 气泡底部引用列表：编号 + 标题，点击调用 onOpenRef
 */

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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

export default function MessageContent({ content, streaming, onOpenRef }: Props) {
  const { refs, processedText } = useMemo(() => {
    const refs = extractRefs(content)
    const refMap = new Map(refs.map((r) => [r.target, r.index]))
    const processedText = replaceWikiLinks(content, refMap)
    return { refs, processedText }
  }, [content])

  return (
    <div className="message-content">
      {/* ── Markdown 区域 ───────────────────────── */}
      <div className={`message-md${streaming ? ' streaming' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          remarkRehypeOptions={{ allowDangerousHtml: true }}
          components={{
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
            // 行内代码保持 mono
            code({ children, className }) {
              const isBlock = className?.startsWith('language-')
              if (isBlock) {
                return (
                  <div className="code-block">
                    <code className={className}>{children}</code>
                  </div>
                )
              }
              return <code className="inline-code">{children}</code>
            },
          }}
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
