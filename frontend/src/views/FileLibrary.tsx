/**
 * FileLibrary — 文件库视图
 *
 * 布局：左侧双栏列表（Sources / Wiki），右侧文件内容预览面板
 *
 * Sources 栏：原始资料，每条显示摄取状态 badge（new/done/changed/empty）
 *             点击「未摄取」/「已更新」badge → 弹出确认对话框 → 摄取为 Wiki
 * Wiki 栏：知识图谱笔记，每条显示类型 badge（source/query/insight/entity/concept）
 * 右侧：选中文件的 Markdown 原始内容（只读）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  authHeaders,
  getSources,
  getWiki,
  uploadSourceFile,
} from '../api/client'

// ── 类型定义 ───────────────────────────────────────────────

interface SourceFile {
  path: string
  abs_path: string
  title?: string
  last_ingested?: string | null
}

interface WikiFile {
  rel_path: string
  abs_path: string
  title: string
  date: string
  tags: string[]
  /** 来源层：personal=我的知识库，course=课程共享库 */
  search_text?: string
}

interface SelectedFile {
  abs_path: string
  display_name: string
}

// ── Badge 颜色映射 ─────────────────────────────────────────

// ── 文件路径简化 ──────────────────────────────────────────

function basename(p: string) {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

// ── 主组件 ────────────────────────────────────────────────

export default function FileLibrary() {
  const [tab, setTab] = useState<'sources' | 'wiki'>('sources')

  // Sources 数据（personal=我的资料）
  const [sources, setSources] = useState<SourceFile[]>([])
  const [sourcesRoot, setSourcesRoot] = useState('')
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesError, setSourcesError] = useState<string | null>(null)

  const [me, setMe] = useState<{ role: 'admin' | 'student' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const courseFileInputRef = useRef<HTMLInputElement>(null)

  // Wiki 数据
  const [wikiFiles, setWikiFiles] = useState<WikiFile[]>([])
  const [wikiLoading, setWikiLoading] = useState(true)
  const [wikiError, setWikiError] = useState<string | null>(null)

  // 选中预览
  const [selected, setSelected] = useState<SelectedFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Sources 搜索
  const [sourcesFilter, setSourcesFilter] = useState('')
  // Wiki 搜索
  const [wikiFilter, setWikiFilter] = useState('')

  // 加载共享 raw 课件
  async function reloadSources() {
    try {
      const c = await getSources() as { files?: SourceFile[]; root?: string }
      setSources(c.files ?? [])
      setSourcesRoot(c.root ?? '')
      setSourcesLoading(false)
    } catch (e) {
      setSourcesError(e instanceof Error ? e.message : String(e))
      setSourcesLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then(setMe).catch(() => {})
    reloadSources()
  }, [])

  // 加载 Wiki（双层：个人 + 课程）
  useEffect(() => {
    getWiki()
      .then((d) => {
        // 兼容旧格式（files 为字符串数组）和新格式（files 为对象数组）
        const raw: unknown[] = (d as { files?: unknown[] }).files ?? []
        const normalized: WikiFile[] = raw.map((item) =>
          typeof item === 'string'
            ? { rel_path: item, abs_path: '', title: item, date: '', tags: [] }
            : (item as WikiFile)
        )
        setWikiFiles(normalized)
        setWikiLoading(false)
      })
      .catch((e) => { setWikiError(e instanceof Error ? e.message : String(e)); setWikiLoading(false) })
  }, [])

  // 加载文件内容（push=true 时写入浏览器历史，支持前进/后退在文件间导航）
  function openFile(abs_path: string, display_name: string, push = true) {
    if (!abs_path) {
      setSelected({ abs_path: '', display_name })
      setPreviewContent(null)
      setPreviewError('后端服务需要重启才能加载文件内容（请执行 frankie web）')
      setPreviewLoading(false)
      return
    }
    if (push) {
      history.pushState(null, '', `?view=files&file=${encodeURIComponent(abs_path)}`)
    }
    setSelected({ abs_path, display_name })
    setPreviewContent(null)
    setPreviewError(null)
    setPreviewLoading(true)
    fetch(`/api/file?path=${encodeURIComponent(abs_path)}`, { headers: { ...authHeaders() } })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d) => { setPreviewContent(d.content); setPreviewLoading(false) })
      .catch((e) => { setPreviewError(e.message); setPreviewLoading(false) })
  }

  const restoreFromUrl = useCallback(() => {
    const file = new URLSearchParams(window.location.search).get('file')
    if (!file) {
      setSelected(null)
      setPreviewContent(null)
      setPreviewError(null)
      return
    }
    const match = wikiFiles.find((item) => item.abs_path === file) ?? sources.find((item) => item.abs_path === file)
    const title = match?.title ?? basename(file)
    openFile(file, title, false)
  }, [wikiFiles, sources])

  useEffect(() => {
    window.addEventListener('popstate', restoreFromUrl)
    return () => window.removeEventListener('popstate', restoreFromUrl)
  }, [restoreFromUrl])

  // 初次挂载或数据就绪后，从 URL 恢复文件（覆盖从聊天跳转、刷新、前进后退）
  useEffect(() => {
    restoreFromUrl()
  }, [restoreFromUrl])

  // 上传资料文件（个人层或课程层）
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setSourcesError(null)
    try {
      for (const f of files) await uploadSourceFile(f, 'course')
      await reloadSources()
    } catch (err) {
      setSourcesError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  // 过滤
  const filteredSources = sources.filter((f) =>
    (f.path ?? '').toLowerCase().includes(sourcesFilter.toLowerCase())
  )
  const filteredWiki = wikiFiles.filter((f) =>
    (f.title ?? '').toLowerCase().includes(wikiFilter.toLowerCase()) ||
    (f.rel_path ?? '').toLowerCase().includes(wikiFilter.toLowerCase()) ||
    (f.search_text ?? '').toLowerCase().includes(wikiFilter.toLowerCase())
  )

  // Wiki 按顶层目录 topic 分组，index.md 置顶
  const wikiByTopic: Record<string, WikiFile[]> = {}
  for (const f of filteredWiki) {
    const topic = f.rel_path === 'index.md' ? 'index' : (f.rel_path.split(/[\\/]/)[0] || 'root')
    if (!wikiByTopic[topic]) wikiByTopic[topic] = []
    wikiByTopic[topic].push(f)
  }
  const sortedTopics = Object.keys(wikiByTopic).sort((a, b) => a === 'index' ? -1 : b === 'index' ? 1 : a.localeCompare(b))

  function renderSourceItem(f: SourceFile) {
    const name = f.title || basename(f.path)
    const isActive = selected?.abs_path === f.abs_path
    return (
      <button
        key={f.abs_path}
        className={`fl-item${isActive ? ' active' : ''}`}
        onClick={() => openFile(f.abs_path, f.title || f.path)}
      >
        <div className="fl-item-top">
          <span className="fl-item-name" title={f.path}>{name}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="file-library">
      <input ref={courseFileInputRef} type="file" multiple hidden onChange={handleUpload} />

      {/* ── 左侧列表面板 ───────────────────────────── */}
      <div className="fl-sidebar">
        {/* Tab 切换 */}
        <div className="fl-tabs">
          <button
            className={`fl-tab${tab === 'sources' ? ' active' : ''}`}
            onClick={() => setTab('sources')}
          >
            📄 课件
          </button>
          <button
            className={`fl-tab${tab === 'wiki' ? ' active' : ''}`}
            onClick={() => setTab('wiki')}
          >
            🧠 Wiki
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
  <button className="fl-search-clear" onClick={() => setSourcesFilter('')} title="清空">
    ✕
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
                {me?.role === 'admin' && <button className="fl-upload-btn" disabled={uploading} onClick={() => courseFileInputRef.current?.click()}>{uploading ? '上传中…' : '⬆ 上传'}</button>}
              </div>
              {!sourcesLoading && !sourcesError && filteredSources.length === 0 && (
                <div className="fl-empty">暂无课件</div>
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
  <button className="fl-search-clear" onClick={() => setWikiFilter('')} title="清空">
    ✕
  </button>
)}
</div>
            <div className="fl-wiki-count">
              共 {filteredWiki.length} 条笔记
            </div>
            {wikiLoading && <div className="loading-text">加载中…</div>}
            {wikiError && <div className="error-text">{wikiError}</div>}
            {!wikiLoading && !wikiError && filteredWiki.length === 0 && (
              <div className="fl-empty">暂无笔记</div>
            )}
            <div className="fl-list">
              {sortedTopics.map((topic) => (
                <div key={topic} className="fl-wiki-group">
                  <div className="fl-wiki-group-header">
                    <span>{topic === 'index' ? '索引' : topic}</span>
                    <span className="fl-wiki-group-count">{wikiByTopic[topic].length}</span>
                  </div>
                  {wikiByTopic[topic].map((f, idx) => {
                    const isActive = selected?.abs_path !== '' && selected?.abs_path === f.abs_path
                    const itemKey = f.abs_path || `${topic}-${idx}`
                    return (
                      <button
                        key={itemKey}
                        className={`fl-item${isActive ? ' active' : ''}`}
                        onClick={() => openFile(f.abs_path, f.title || f.rel_path || '')}
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
        {!selected && (
          <div className="fl-preview-empty">
            <div className="fl-preview-empty-icon">📄</div>
            <div>点击左侧文件查看内容</div>
          </div>
        )}
        {selected && (
          <>
            <div className="fl-preview-header">
              <span className="fl-preview-title" title={selected.abs_path}>
                {selected.display_name}
              </span>
            </div>
            <div className="fl-preview-body">
              {previewLoading && <div className="loading-text">加载中…</div>}
              {previewError && <div className="error-text">无法加载：{previewError}</div>}
              {previewContent !== null && !previewLoading && (
                <div className="fl-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            onClick={(event) => {
                              event.preventDefault()
                              const title = href || String(children)
                              fetch(`/api/wiki/resolve?title=${encodeURIComponent(title)}`, { headers: { ...authHeaders() } })
                                .then((response) => response.ok ? response.json() : null)
                                .then((wiki) => wiki && openFile(wiki.abs_path, wiki.title || title))
                                .catch(() => {})
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
