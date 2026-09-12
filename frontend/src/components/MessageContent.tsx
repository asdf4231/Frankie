/**
 * MessageContent
 *
 * 渲染聊天消息与资料文档：
 * 1. 将 [[页面路径|显示名称]] 替换为行内上标引用，悬停或聚焦显示页面的真实标题
 * 2. 渲染完整 Markdown（加粗、列表、代码块等）
 * 3. 引用点击调用 onOpenRef；底部展示消息操作
 *
 * 组件经 memo 包裹：Markdown 解析和 KaTeX 渲染都在 render 中同步进行，
 * 调用方必须传入稳定的 onOpenRef；复制按钮的反馈状态由按钮自身管理。
 */

import { Children, memo, useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components, type ExtraProps, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import Citation from './Citation'
import Icon from './Icon'
import './Markdown.css'

const REMARK_PLUGINS: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkMath]
// 只输出 HTML：默认还会为每个公式额外生成一份隐藏的 MathML，DOM 体积翻倍。
const REHYPE_PLUGINS: NonNullable<Options['rehypePlugins']> = [[rehypeKatex, { output: 'html' }]]
const REMARK_REHYPE_OPTIONS: Options['remarkRehypeOptions'] = { allowDangerousHtml: true }
const ANNOTATION_LABEL = /^(?:Course(?: sources?)?|Original|PDF(?: pages)?|Section):/i

/** Read annotation values including Markdown links and inline formatting. */
function annotationText(node: NonNullable<ExtraProps['node']>['children'][number]): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return ''
  if (node.tagName === 'br') return '\n'
  return node.children.map(annotationText).join('')
}

interface Ref {
  index: number
  target: string
  sourcePath?: string
}

interface Props {
  content: string
  streaming?: boolean
  onOpenRef?: (target: string) => void
  /** Library document path: scopes relative links and document metadata presentation. */
  sourcePath?: string
  actions?: ReactNode
}

/** 按链接目标去重；标题由 Citation 从课程页面解析。 */
function extractRefs(text: string, sourcePath?: string): Ref[] {
  const seen = new Map<string, Ref>()
  const pattern = /\[\[([^\]]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const target = match[1].split('|', 1)[0].trim()
    if (!seen.has(target)) {
      seen.set(target, { index: seen.size + 1, target, sourcePath })
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

function MessageContent({ content, streaming, onOpenRef, sourcePath, actions }: Props) {
  // Keep reference renderers mounted while prose streams, including an open citation tooltip.
  const referenceText = content.match(/\[\[[^\]]+\]\]/g)?.join('\n') ?? ''
  const refs = useMemo(() => extractRefs(referenceText, sourcePath), [referenceText, sourcePath])
  const processedText = useMemo(() => replaceWikiLinks(content, new Map(refs.map((r) => [r.target, r.index]))), [content, refs])

  const components = useMemo<Components>(() => ({
    a({ children, href }) {
      const external = !!href && /^(https?:|mailto:|\/\/)/i.test(href)
      const newTab = !!sourcePath && external
      return (
        <a
          href={href}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          onClick={(event) => {
            if (external) return
            event.preventDefault()
            const label = String(children)
            onOpenRef?.(href || label)
          }}
        >
          {children}
          {newTab && <><Icon name="external-link" size={12} className="md-external-icon" /><span className="visually-hidden">（在新标签页打开）</span></>}
        </a>
      )
    },
    table({ children }) {
      return <div className="md-table"><table>{children}</table></div>
    },
    // 把编号占位符渲染为行内引用按钮。
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
    h4({ children }) {
      return <h4>{renderWithRefs(children, refs, onOpenRef)}</h4>
    },
    h5({ children }) {
      return <h5>{renderWithRefs(children, refs, onOpenRef)}</h5>
    },
    h6({ children }) {
      return <h6>{renderWithRefs(children, refs, onOpenRef)}</h6>
    },
    strong({ children }) {
      return <strong>{renderWithRefs(children, refs, onOpenRef)}</strong>
    },
    em({ children }) {
      return <em>{renderWithRefs(children, refs, onOpenRef)}</em>
    },
    del({ children }) {
      return <del>{renderWithRefs(children, refs, onOpenRef)}</del>
    },
    th({ children }) {
      return <th>{renderWithRefs(children, refs, onOpenRef)}</th>
    },
    td({ children }) {
      return <td>{renderWithRefs(children, refs, onOpenRef)}</td>
    },
    blockquote({ children, node }) {
      // Library documents share metadata conventions. Match whole annotation blocks, not prose or code examples.
      const annotation = sourcePath && node?.children.some((child) => child.type === 'element' && child.tagName === 'p')
        && node.children.every((child) => {
          if (child.type === 'text') return !child.value.trim()
          if (child.type !== 'element' || child.tagName !== 'p') return false
          const first = child.children[0]
          return first?.type === 'text' && ANNOTATION_LABEL.test(first.value.trimStart())
            && annotationText(child).trim().split(/\r?\n/).every((line) => ANNOTATION_LABEL.test(line.trim()))
        })
      if (annotation) return null
      return <blockquote>{renderWithRefs(children, refs, onOpenRef)}</blockquote>
    },
  }), [refs, onOpenRef, sourcePath])

  return (
    <div className="message-content">
      {/* ── Markdown 区域 ───────────────────────── */}
      <div className="md">
        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={REHYPE_PLUGINS}
          remarkRehypeOptions={REMARK_REHYPE_OPTIONS}
          components={components}
        >
          {processedText}
        </ReactMarkdown>
        {streaming && <span className="md-caret" aria-hidden="true" />}
      </div>

      {!streaming && actions && <div className="message-footer">{actions}</div>}
    </div>
  )
}

export default memo(MessageContent)

// ── 工具函数：递归把 React children 里的占位符替换为引用按钮 ──────

function renderWithRefs(
  children: React.ReactNode,
  refs: Ref[],
  onOpenRef?: (target: string) => void,
): React.ReactNode {
  if (refs.length === 0) return children
  if (typeof children === 'string') {
    return splitByRefs(children, refs, onOpenRef)
  }
  if (Array.isArray(children)) {
    return Children.map(children, (child) => renderWithRefs(child, refs, onOpenRef))
  }
  // Each Markdown text element handles its own children; leave code, links and KaTeX DOM alone.
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
      return <Citation key={i} index={ref.index} target={ref.target} sourcePath={ref.sourcePath} onOpen={onOpenRef} />
    }
    return part
  })
}
