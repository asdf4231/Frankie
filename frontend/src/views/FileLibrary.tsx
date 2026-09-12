/**
 * FileLibrary — 文件库视图
 *
 * 左侧展示课程讲义和 Wiki，右侧预览 Markdown。
 */

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import ReactMarkdown, { type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import '../components/Markdown.css'
import { resolveWiki, type SourceFile, type WikiFile } from '../api/client'
import Icon from '../components/Icon'
import { getSourcesCached, getWikiCached } from '../lib/cache'
import { navigate, useRoute, viewForRelPath, type View } from '../lib/router'

const REMARK_PLUGINS: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkMath]
// 只输出 HTML：默认还会为每个公式额外生成一份隐藏的 MathML。
const REHYPE_PLUGINS: NonNullable<Options['rehypePlugins']> = [[rehypeKatex, { output: 'html' }]]

// ── 文件路径简化 ──────────────────────────────────────────

function basename(p: string) {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

// ── 主组件 ────────────────────────────────────────────────

export default function FileLibrary() {
  // 视图与选中文件都来自 URL：?view=wiki|lectures&file=<abs_path>
  const route = useRoute()
  const tab: 'sources' | 'wiki' = route.view === 'wiki' ? 'wiki' : 'sources'
  const listView: View = tab === 'wiki' ? 'wiki' : 'lectures'
  const selectedPath = route.file ?? null

  // 课程讲义
  const [sources, setSources] = useState<SourceFile[]>([])
  const [sourcesRoot, setSourcesRoot] = useState('')
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesError, setSourcesError] = useState<string | null>(null)

  // Wiki 数据
  const [wikiFiles, setWikiFiles] = useState<WikiFile[]>([])
  const [wikiLoading, setWikiLoading] = useState(true)
  const [wikiError, setWikiError] = useState<string | null>(null)

  // 选中预览：内容按路径异步加载
  const [preview, setPreview] = useState<{ path: string; content: string } | null>(null)
  const [previewFailure, setPreviewFailure] = useState<{ path: string; message: string } | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  // Sources 搜索
  const [sourcesFilter, setSourcesFilter] = useState('')
  // Wiki 搜索
  const [wikiFilter, setWikiFilter] = useState('')

  // 加载共享 raw 课件
  useEffect(() => {
    let active = true
    getSourcesCached()
      .then((payload) => {
        if (!active) return
        setSources(payload.files ?? [])
        setSourcesRoot(payload.root ?? '')
        setSourcesLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setSourcesError(e instanceof Error ? e.message : String(e))
        setSourcesLoading(false)
      })
    return () => { active = false }
  }, [])

  // 加载课程 Wiki
  useEffect(() => {
    let active = true
    getWikiCached()
      .then((payload) => {
        if (!active) return
        setWikiFiles(payload.files)
        setWikiLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setWikiError(e instanceof Error ? e.message : String(e))
        setWikiLoading(false)
      })
    return () => { active = false }
  }, [])

  // 打开文件：写入浏览器历史，支持前进/后退在文件间导航
  function openFile(abs_path: string, view: View = listView) {
    setLinkError(null)
    navigate({ view, file: abs_path })
  }

  function closePreview() {
    navigate({ view: listView })
  }

  // 加载文件内容：每个路径只请求一次；路径变化时取消未完成的请求
  useEffect(() => {
    if (!selectedPath) return
    const path = selectedPath
    const controller = new AbortController()
    fetch(`/api/file?path=${encodeURIComponent(path)}`, { signal: controller.signal, credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: { content: string }) => setPreview({ path, content: d.content }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setPreviewFailure({ path, message: e instanceof Error ? e.message : String(e) })
      })
    return () => controller.abort()
  }, [selectedPath])

  const previewContent = preview && preview.path === selectedPath ? preview.content : null
  const previewError = previewFailure && previewFailure.path === selectedPath ? previewFailure.message : null
  const previewLoading = selectedPath !== null && previewContent === null && previewError === null
  const selectedTitle = useMemo(() => {
    if (!selectedPath) return ''
    const wiki = wikiFiles.find((item) => item.abs_path === selectedPath)
    if (wiki) return wiki.title || wiki.rel_path
    const source = sources.find((item) => item.abs_path === selectedPath)
    if (source) return source.title || source.path
    return basename(selectedPath)
  }, [selectedPath, wikiFiles, sources])

  // 过滤：搜索文本在列表加载时预先合并并小写化，输入时每个文件只做一次 includes；
  // 过滤词经 useDeferredValue 延迟，输入框本身不会被过滤计算拖慢。
  const deferredSourcesFilter = useDeferredValue(sourcesFilter)
  const deferredWikiFilter = useDeferredValue(wikiFilter)
  const sourcesIndex = useMemo(
    () => sources.map((file) => ({ file, text: (file.path ?? '').toLowerCase() })),
    [sources],
  )
  const wikiIndex = useMemo(
    () => wikiFiles.map((file) => ({
      file,
      text: [file.title, file.rel_path, file.search_text].filter(Boolean).join('\n').toLowerCase(),
    })),
    [wikiFiles],
  )
  const filteredSources = useMemo(() => {
    const query = deferredSourcesFilter.trim().toLowerCase()
    return query ? sourcesIndex.filter((entry) => entry.text.includes(query)).map((entry) => entry.file) : sources
  }, [sources, sourcesIndex, deferredSourcesFilter])
  const filteredWiki = useMemo(() => {
    const query = deferredWikiFilter.trim().toLowerCase()
    return query ? wikiIndex.filter((entry) => entry.text.includes(query)).map((entry) => entry.file) : wikiFiles
  }, [wikiFiles, wikiIndex, deferredWikiFilter])

  // Wiki 按顶层目录 topic 分组，index.md 置顶
  const { wikiByTopic, sortedTopics } = useMemo(() => {
    const byTopic: Record<string, WikiFile[]> = {}
    for (const f of filteredWiki) {
      const topic = f.rel_path === 'index.md' ? 'index' : (f.rel_path.split(/[\\/]/)[0] || 'root')
      if (!byTopic[topic]) byTopic[topic] = []
      byTopic[topic].push(f)
    }
    const topics = Object.keys(byTopic).sort((a, b) => a === 'index' ? -1 : b === 'index' ? 1 : a.localeCompare(b))
    return { wikiByTopic: byTopic, sortedTopics: topics }
  }, [filteredWiki])

  function renderSourceItem(f: SourceFile) {
    const name = f.title || basename(f.path)
    const isActive = selectedPath === f.abs_path
    return (
      <button
        key={f.abs_path}
        className={`fl-item${isActive ? ' active' : ''}`}
        onClick={() => openFile(f.abs_path)}
      >
        <div className="fl-item-top">
          <span className="fl-item-name" title={f.path}>{name}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="file-library">
      {/* ── 左侧列表面板 ───────────────────────────── */}
      <div className="fl-sidebar">
        {/* Tab 切换 */}
        <div className="fl-tabs">
          <button
            className={`fl-tab${tab === 'sources' ? ' active' : ''}`}
            onClick={() => navigate({ view: 'lectures' })}
          >
            <Icon name="file-text" size={16} /> 课件
          </button>
          <button
            className={`fl-tab${tab === 'wiki' ? ' active' : ''}`}
            onClick={() => navigate({ view: 'wiki' })}
          >
            <Icon name="book-open" size={16} /> Wiki
          </button>
        </div>

        {/* Sources 面板 */}
        {tab === 'sources' && (
          <div className="fl-panel">
<div className="fl-search-wrap">
<input
className="fl-search"
placeholder="过滤文件名…"
value={sourcesFilter}
onChange={(e) => setSourcesFilter(e.target.value)}
/>
{sourcesFilter && (
  <button className="fl-search-clear" onClick={() => setSourcesFilter('')} title="清空" aria-label="清空课件搜索">
    <Icon name="x" size={13} />
  </button>
)}
</div>
            {sourcesRoot && (
              <div className="fl-root-label" title={sourcesRoot}>
                {sourcesRoot.length > 46 ? '…' + sourcesRoot.slice(-44) : sourcesRoot}
              </div>
            )}
            {sourcesLoading && <div className="loading-text">加载中…</div>}
            {sourcesError && <div className="error-text">{sourcesError}</div>}
            <div className="fl-list">
              {/* ── 共享课件 ── */}
              <div className="fl-src-group-header">
                <span>课件</span>
              </div>
              {!sourcesLoading && !sourcesError && filteredSources.length === 0 && (
                <div className="fl-empty"><Icon name="file-text" size={16} /> 暂无课件</div>
              )}
              {filteredSources.map((f) => renderSourceItem(f))}
            </div>
          </div>
        )}

        {/* Wiki 面板 */}
        {tab === 'wiki' && (
          <div className="fl-panel">
<div className="fl-search-wrap">
<input
className="fl-search"
placeholder="全文搜索 Wiki…"
value={wikiFilter}
onChange={(e) => setWikiFilter(e.target.value)}
/>
{wikiFilter && (
  <button className="fl-search-clear" onClick={() => setWikiFilter('')} title="清空" aria-label="清空 Wiki 搜索">
    <Icon name="x" size={13} />
  </button>
)}
</div>
            <div className="fl-wiki-count">
              共 {filteredWiki.length} 条笔记
            </div>
            {wikiLoading && <div className="loading-text">加载中…</div>}
            {wikiError && <div className="error-text">{wikiError}</div>}
            {!wikiLoading && !wikiError && filteredWiki.length === 0 && (
              <div className="fl-empty"><Icon name="book-open" size={16} /> 暂无笔记</div>
            )}
            <div className="fl-list">
              {sortedTopics.map((topic) => (
                <div key={topic} className="fl-wiki-group">
                  <div className="fl-wiki-group-header">
                    <span><Icon name="chevron-right" size={12} />{topic === 'index' ? '索引' : topic}</span>
                    <span className="fl-wiki-group-count">{wikiByTopic[topic].length}</span>
                  </div>
                  {wikiByTopic[topic].map((f) => {
                    const isActive = selectedPath === f.abs_path
                    return (
                      <button
                        key={f.abs_path}
                        className={`fl-item${isActive ? ' active' : ''}`}
                        onClick={() => openFile(f.abs_path)}
                      >
                        <div className="fl-item-top">
                          <span className="fl-item-name" title={f.rel_path ?? ''}>
                            {f.title || basename(f.rel_path ?? '')}
                          </span>
                        </div>
                        {(f.tags ?? []).length > 0 && (
                          <div className="fl-item-tags">
                            {(f.tags ?? []).slice(0, 4).map((t) => (
                              <span key={t} className="fl-tag">{t}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 右侧预览面板 ──────────────────────────── */}
      <div className="fl-preview">
        {!selectedPath && (
          <div className="fl-preview-empty">
            <Icon name="file-text" size={39} className="fl-preview-empty-icon" />
            <div>点击左侧文件查看内容</div>
          </div>
        )}
        {selectedPath && (
          <>
            <div className="fl-preview-header">
              <button className="fl-back-btn" onClick={closePreview} title="返回列表" aria-label="返回文件列表"><Icon name="chevron-left" size={18} /></button>
              <span className="fl-preview-title" title={selectedPath}>
                {selectedTitle}
              </span>
            </div>
            <div className="fl-preview-body">
              {previewLoading && <div className="loading-text">加载中…</div>}
              {previewError && <div className="error-text">无法加载：{previewError}</div>}
              {linkError && <div className="error-text" role="alert">无法打开链接：{linkError}</div>}
              {previewContent !== null && !previewLoading && (
                <div className="md">
                  <ReactMarkdown
                    remarkPlugins={REMARK_PLUGINS}
                    rehypePlugins={REHYPE_PLUGINS}
                    components={{
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            onClick={(event) => {
                              if (href && /^(https?:|mailto:|\/\/)/i.test(href)) return
                              event.preventDefault()
                              setLinkError(null)
                              const title = href || String(children)
                              resolveWiki(title, selectedPath)
                                .then((wiki) => openFile(wiki.abs_path, viewForRelPath(wiki.rel_path)))
                                .catch((error: unknown) => {
                                  setLinkError(error instanceof Error ? error.message : String(error))
                                })
                            }}
                          >
                            {children}
                          </a>
                        )
                      },
                    }}
                  >
                    {previewContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
