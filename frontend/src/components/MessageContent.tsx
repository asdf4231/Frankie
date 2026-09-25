/**
 * MessageContent
 *
 * 渲染聊天消息与资料文档：
 * 1. 将 [[页面路径|显示名称]] 替换为行内上标引用，悬停或聚焦显示页面的真实标题
 * 2. 渲染完整 Markdown（加粗、列表、代码块等）
 * 3. 内部链接使用可复制、可新开标签页的 Frankie 路由；底部展示消息操作
 *
 * 组件经 memo 包裹：Markdown 解析和 KaTeX 渲染都在 render 中同步进行，
 * 引用只在悬停、聚焦或导航时通过共享缓存解析，避免渲染阶段产生逐链接请求。
 */

import { Children, memo, useEffect, useMemo, useRef, type ReactNode } from 'react'
import ReactMarkdown, { type Components, type ExtraProps, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { DocumentHeading } from '../api/client'
import { remarkChatMath } from '../lib/chatMath'
import { registerMathCopy } from '../lib/mathCopy'
import { followRoute, pendingReferenceRoute, routeHref, useRoute } from '../lib/router'
import Citation from './Citation'
import Icon from './Icon'
import './Markdown.css'

const REMARK_PLUGINS: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkMath]
const CHAT_REMARK_PLUGINS: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkChatMath]
// KaTeX's official default renders accessible MathML alongside aria-hidden visual HTML.
const REHYPE_PLUGINS: NonNullable<Options['rehypePlugins']> = [rehypeKatex]
const REMARK_REHYPE_OPTIONS: Options['remarkRehypeOptions'] = { allowDangerousHtml: true }

type HeadingNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  position?: { start: { line: number } }
  children?: HeadingNode[]
}

/** Apply only backend-issued anchors; source positions remain relative to the frontmatter-free Markdown body. */
function rehypeHeadingIds({ headings }: { headings: DocumentHeading[] }) {
  const byLine = new Map(headings.map((heading) => [heading.line, heading]))
  return (tree: HeadingNode) => {
    const visit = (node: HeadingNode) => {
      const level = node.tagName?.match(/^h([1-6])$/)?.[1]
      const heading = node.position && level ? byLine.get(node.position.start.line) : undefined
      if (heading && heading.level === Number(level)) node.properties = { ...node.properties, id: heading.anchor }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}
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
  /** Library document path: scopes relative links and document metadata presentation. */
  sourcePath?: string
  headings?: DocumentHeading[]
  hiddenHeadingLine?: number
  actions?: ReactNode
}

/** Subscribe links independently so filter edits never reparse the surrounding Markdown. */
function InternalLink({ target, sourcePath, children }: { target: string; sourcePath?: string; children: ReactNode }) {
  const current = useRoute()
  const destination = { ...pendingReferenceRoute(target, sourcePath), librarySearch: current.librarySearch, sidebarSearch: current.sidebarSearch }
  return <a href={routeHref(destination)} onClick={(event) => followRoute(event, destination, { intent: 'document', fromFile: current.file })}>{children}</a>
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

function MessageContent({ content, streaming, sourcePath, headings, hiddenHeadingLine, actions }: Props) {
  const markdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = markdownRef.current
    if (root) return registerMathCopy(root)
  }, [])

  // Keep reference renderers mounted while prose streams, including an open citation tooltip.
  const referenceText = content.match(/\[\[[^\]]+\]\]/g)?.join('\n') ?? ''
  const refs = useMemo(() => extractRefs(referenceText, sourcePath), [referenceText, sourcePath])
  const processedText = useMemo(() => replaceWikiLinks(content, new Map(refs.map((r) => [r.target, r.index]))), [content, refs])
  const rehypePlugins = useMemo<NonNullable<Options['rehypePlugins']>>(
    () => headings ? [[rehypeHeadingIds, { headings }], rehypeKatex] : REHYPE_PLUGINS,
    [headings],
  )

  const components = useMemo<Components>(() => ({
    a({ children, href }) {
      const external = !!href && /^(https?:|mailto:|\/\/)/i.test(href)
      const newTab = !!sourcePath && external
      if (external) return (
        <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
          {children}
          {newTab && <><Icon name="external-link" size={12} className="md-external-icon" /><span className="visually-hidden">(opens in a new tab)</span></>}
        </a>
      )
      return <InternalLink target={href || String(children)} sourcePath={sourcePath}>{children}</InternalLink>
    },
    img({ width, height, node, ...props }) {
      void node
      return <img {...props} width={width} height={height} loading="lazy" decoding="async" />
    },
    code({ children, node, ...props }) {
      void node
      return <code {...props} translate="no">{children}</code>
    },
    table({ children }) {
      return <div className="md-table"><table>{children}</table></div>
    },
    // 把编号占位符渲染为行内引用按钮。
    p({ children }) {
      return <p>{renderWithRefs(children, refs)}</p>
    },
    li({ children }) {
      return <li>{renderWithRefs(children, refs)}</li>
    },
    h1({ children, node, ...props }) {
      if (node?.position?.start.line === hiddenHeadingLine) return null
      return <h1 {...props}>{renderWithRefs(children, refs)}</h1>
    },
    h2({ children, node, ...props }) {
      void node
      return <h2 {...props}>{renderWithRefs(children, refs)}</h2>
    },
    h3({ children, node, ...props }) {
      void node
      return <h3 {...props}>{renderWithRefs(children, refs)}</h3>
    },
    h4({ children, node, ...props }) {
      void node
      return <h4 {...props}>{renderWithRefs(children, refs)}</h4>
    },
    h5({ children, node, ...props }) {
      void node
      return <h5 {...props}>{renderWithRefs(children, refs)}</h5>
    },
    h6({ children, node, ...props }) {
      void node
      return <h6 {...props}>{renderWithRefs(children, refs)}</h6>
    },
    strong({ children }) {
      return <strong>{renderWithRefs(children, refs)}</strong>
    },
    em({ children }) {
      return <em>{renderWithRefs(children, refs)}</em>
    },
    del({ children }) {
      return <del>{renderWithRefs(children, refs)}</del>
    },
    th({ children }) {
      return <th>{renderWithRefs(children, refs)}</th>
    },
    td({ children }) {
      return <td>{renderWithRefs(children, refs)}</td>
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
      return <blockquote>{renderWithRefs(children, refs)}</blockquote>
    },
  }), [refs, sourcePath, hiddenHeadingLine])

  return (
    <div className="message-content">
      {/* ── Markdown 区域 ───────────────────────── */}
      <div className="md" ref={markdownRef}>
        <ReactMarkdown
          remarkPlugins={sourcePath ? REMARK_PLUGINS : CHAT_REMARK_PLUGINS}
          rehypePlugins={rehypePlugins}
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
): React.ReactNode {
  if (refs.length === 0) return children
  if (typeof children === 'string') {
    return splitByRefs(children, refs)
  }
  if (Array.isArray(children)) {
    return Children.map(children, (child) => renderWithRefs(child, refs))
  }
  // Each Markdown text element handles its own children; leave code, links and KaTeX DOM alone.
  return children
}

function splitByRefs(
  text: string,
  refs: Ref[],
): React.ReactNode {
  const parts = text.split(/(%%REF:\d+%%)/g)
  return parts.map((part, i) => {
    const m = part.match(/^%%REF:(\d+)%%$/)
    const ref = m ? refs[Number(m[1]) - 1] : undefined
    if (ref) {
      return <Citation key={i} index={ref.index} target={ref.target} sourcePath={ref.sourcePath} />
    }
    return part
  })
}
