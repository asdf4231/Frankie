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

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  authHeaders,
  getAuthMe,
  getSources,
  getWiki,
  ingestPath,
  ingestSharedPath,
  uploadSourceFile,
  type AuthMe,
} from '../api/client'

// ── 类型定义 ───────────────────────────────────────────────

interface SourceFile {
  path: string
  abs_path: string
  status: 'new' | 'done' | 'changed' | 'empty'
  last_ingested: string | null
}

interface WikiFile {
  rel_path: string
  abs_path: string
  type: string
  title: string
  date: string
  tags: string[]
  /** 来源层：personal=我的知识库，course=课程共享库 */
  layer?: 'personal' | 'course'
  search_text?: string
}

interface SelectedFile {
  abs_path: string
  display_name: string
}

// ── Badge 颜色映射 ─────────────────────────────────────────

const SOURCE_STATUS_CLASS: Record<string, string> = {
  done:    'badge-green',
  changed: 'badge-yellow',
  new:     'badge-blue',
  empty:   'badge-muted',
}

const SOURCE_STATUS_LABEL: Record<string, string> = {
  done:    '已摄取',
  changed: '已更新',
  new:     '未摄取',
  empty:   '空文件',
}

const WIKI_TYPE_CLASS: Record<string, string> = {
  source:  'badge-teal',
  query:   'badge-blue',
  insight: 'badge-purple',
  entity:  'badge-yellow',
  concept: 'badge-green',
}

const WIKI_TYPE_LABEL: Record<string, string> = {
  source: '课件摘要',
  query: '查询记录',
  insight: '对话洞见',
  entity: '实体',
  concept: '概念',
  other: '未分类',
}

// ── 文件路径简化 ──────────────────────────────────────────

function basename(p: string) {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

function dirpart(p: string) {
  const parts = p.replace(/\\/g, '/').split('/')
  parts.pop()
  return parts.join('/') || ''
}

// ── 主组件 ────────────────────────────────────────────────

export default function FileLibrary() {
  const [tab, setTab] = useState<'sources' | 'wiki'>('sources')

  // Sources 数据（personal=我的资料）
  const [sources, setSources] = useState<SourceFile[]>([])
  const [sourcesRoot, setSourcesRoot] = useState('')
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [sourcesError, setSourcesError] = useState<string | null>(null)

  // 课程共享资料（course，学生只读；admin 可上传/摄取）
  const [courseSources, setCourseSources] = useState<SourceFile[]>([])
  const [me, setMe] = useState<AuthMe | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // 摄取确认对话框（含目标层：personal=我的 / course=课程）
  const [confirmTarget, setConfirmTarget] = useState<{
    file: SourceFile
    layer: 'personal' | 'course'
  } | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 摄取状态：abs_path → 'ingesting' | 'error'
  const [ingestingMap, setIngestingMap] = useState<Record<string, 'ingesting' | 'error'>>({})

  // 加载两层 Sources（个人 + 课程共享）
  async function reloadSources() {
    try {
      const [p, c] = await Promise.all([
        getSources('personal') as Promise<{ files?: SourceFile[]; root?: string }>,
        getSources('course') as Promise<{ files?: SourceFile[] }>,
      ])
      setSources(p.files ?? [])
      setSourcesRoot(p.root ?? '')
      setCourseSources(c.files ?? [])
      setSourcesLoading(false)
    } catch (e) {
      setSourcesError(e instanceof Error ? e.message : String(e))
      setSourcesLoading(false)
    }
  }

  useEffect(() => {
    getAuthMe().then(setMe).catch(() => { /* dev 默认账号兜底 */ })
    reloadSources()
    const openPendingWiki = () => {
      const raw = window.localStorage.getItem('frankie-open-wiki')
      if (!raw) return
      try {
        const file = JSON.parse(raw) as { abs_path?: string; title?: string; rel_path?: string }
        if (file.abs_path) openFile(file.abs_path, file.title || file.rel_path || '')
      } finally {
        window.localStorage.removeItem('frankie-open-wiki')
      }
    }
    window.addEventListener('frankie-open-wiki', openPendingWiki)
    openPendingWiki()
    return () => window.removeEventListener('frankie-open-wiki', openPendingWiki)
  }, [])

  // 加载 Wiki（双层：个人 + 课程）
  useEffect(() => {
    getWiki()
      .then((d) => {
        // 兼容旧格式（files 为字符串数组）和新格式（files 为对象数组）
        const raw: unknown[] = (d as { files?: unknown[] }).files ?? []
        const normalized: WikiFile[] = raw.map((item) =>
          typeof item === 'string'
            ? { rel_path: item, abs_path: '', type: '', title: item, date: '', tags: [] }
            : (item as WikiFile)
        )
        setWikiFiles(normalized)
        setWikiLoading(false)
      })
      .catch((e) => { setWikiError(e instanceof Error ? e.message : String(e)); setWikiLoading(false) })
  }, [])

  // 对话框打开/关闭同步
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (confirmTarget) {
      dlg.showModal()
    } else {
      dlg.close()
    }
  }, [confirmTarget])

  // 加载文件内容
  function openFile(abs_path: string, display_name: string) {
    if (!abs_path) {
      setSelected({ abs_path: '', display_name })
      setPreviewContent(null)
      setPreviewError('后端服务需要重启才能加载文件内容（请执行 frankie web）')
      setPreviewLoading(false)
      return
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

  // 点击 badge → 打开确认框（仅 new/changed；course 层仅 admin）
  function handleBadgeClick(e: React.MouseEvent, f: SourceFile, layer: 'personal' | 'course') {
    e.stopPropagation()
    if (f.status !== 'new' && f.status !== 'changed') return
    if (!f.abs_path) return
    if (layer === 'course' && me?.role !== 'admin') return
    setConfirmTarget({ file: f, layer })
  }

  // 确认摄取
  async function confirmIngest() {
    const target = confirmTarget
    if (!target) return
    const { file: f, layer } = target
    setConfirmTarget(null)
    setIngestingMap((prev) => ({ ...prev, [f.abs_path]: 'ingesting' }))
    try {
      if (layer === 'course') {
        await ingestSharedPath(f.abs_path)
      } else {
        await ingestPath(f.abs_path)
      }
      // 就地更新状态（按层更新对应列表）
      const patch = (prev: SourceFile[]) =>
        prev.map((s) =>
          s.abs_path === f.abs_path
            ? { ...s, status: 'done' as const, last_ingested: new Date().toISOString() }
            : s
        )
      if (layer === 'course') setCourseSources(patch)
      else setSources(patch)
      setIngestingMap((prev) => {
        const next = { ...prev }
        delete next[f.abs_path]
        return next
      })
    } catch {
      setIngestingMap((prev) => ({ ...prev, [f.abs_path]: 'error' }))
      // 3s 后清除错误，允许重试
      setTimeout(() => {
        setIngestingMap((prev) => {
          const next = { ...prev }
          delete next[f.abs_path]
          return next
        })
      }, 3000)
    }
  }

  // 上传资料文件（个人层或课程层）
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, layer: 'personal' | 'course') {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setSourcesError(null)
    try {
      for (const f of files) await uploadSourceFile(f, layer)
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
  const filteredCourseSources = courseSources.filter((f) =>
    (f.path ?? '').toLowerCase().includes(sourcesFilter.toLowerCase())
  )
  const filteredWiki = wikiFiles.filter((f) =>
    (f.title ?? '').toLowerCase().includes(wikiFilter.toLowerCase()) ||
    (f.rel_path ?? '').toLowerCase().includes(wikiFilter.toLowerCase()) ||
    (f.search_text ?? '').toLowerCase().includes(wikiFilter.toLowerCase())
  )

  // Wiki 按 type 分组
  const wikiByType: Record<string, WikiFile[]> = {}
  for (const f of filteredWiki) {
    const t = f.type || 'other'
    if (!wikiByType[t]) wikiByType[t] = []
    wikiByType[t].push(f)
  }
  const TYPE_ORDER = ['source', 'query', 'insight', 'entity', 'concept', 'other']
  const sortedTypes = TYPE_ORDER.filter((t) => wikiByType[t])

  // 渲染单个资料条目（layer 决定 badge 是否可摄取）
  function renderSourceItem(f: SourceFile, layer: 'personal' | 'course') {
    const dir = dirpart(f.path)
    const name = basename(f.path)
    const isActive = selected?.abs_path === f.abs_path
    const ingestState = ingestingMap[f.abs_path]
    const canIngest =
      (f.status === 'new' || f.status === 'changed') &&
      !!f.abs_path &&
      (layer === 'personal' || me?.role === 'admin')
    // badge 展示：摄取中时替换显示
    const badgeClass = ingestState === 'ingesting'
      ? 'badge-dim'
      : ingestState === 'error'
      ? 'badge-red'
      : SOURCE_STATUS_CLASS[f.status] ?? 'badge-muted'
    const badgeLabel = ingestState === 'ingesting'
      ? '摄取中…'
      : ingestState === 'error'
      ? '摄取失败'
      : SOURCE_STATUS_LABEL[f.status] ?? f.status
    const badgeTitle = canIngest && !ingestState
      ? '点击摄取为 Wiki'
      : layer === 'course' && me?.role !== 'admin'
      ? '课程资料由教师统一维护'
      : undefined
    return (
      <button
        key={f.abs_path}
        className={`fl-item${isActive ? ' active' : ''}`}
        onClick={() => openFile(f.abs_path, f.path)}
      >
        <div className="fl-item-top">
          <span className="fl-item-name" title={f.path}>{name}</span>
          <span
            className={`fl-badge ${badgeClass}${canIngest && !ingestState ? ' fl-badge-clickable' : ''}`}
            onClick={canIngest && !ingestState ? (e) => handleBadgeClick(e, f, layer) : undefined}
            title={badgeTitle}
          >
            {badgeLabel}
          </span>
        </div>
        {dir && <div className="fl-item-dir">{dir}</div>}
        {f.last_ingested && (
          <div className="fl-item-meta">
            摄取于 {f.last_ingested.slice(0, 10)}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="file-library">
      {/* 隐藏的上传文件选择器 */}
      <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleUpload(e, 'personal')} />
      <input ref={courseFileInputRef} type="file" multiple hidden onChange={(e) => handleUpload(e, 'course')} />

      {/* ── 摄取确认对话框 ────────────────────────── */}
      <dialog ref={dialogRef} className="ingest-dialog" onClose={() => setConfirmTarget(null)}>
        <div className="ingest-dialog-body">
          <div className="ingest-dialog-icon">📥</div>
          <div className="ingest-dialog-title">摄取为 Wiki？</div>
          <div className="ingest-dialog-file">
            {confirmTarget ? basename(confirmTarget.file.path) : ''}
          </div>
          <div className="ingest-dialog-desc">
            {confirmTarget?.layer === 'course'
              ? '该课程资料将被整理为 Wiki 笔记，保存到全班共享的课程知识库。'
              : '该文件将被 Frankie 阅读并整理为一篇 Wiki 笔记，保存到你的个人知识库。'}
          </div>
          <div className="ingest-dialog-actions">
            <button
              className="ingest-dialog-btn ingest-dialog-btn--cancel"
              onClick={() => setConfirmTarget(null)}
            >
              取消
            </button>
            <button
              className="ingest-dialog-btn ingest-dialog-btn--confirm"
              onClick={confirmIngest}
            >
              确认摄取
            </button>
          </div>
        </div>
      </dialog>

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
              {/* ── 我的资料（可上传、可摄取）── */}
              <div className="fl-src-group-header">
                <span>我的资料</span>
                <button
                  className="fl-upload-btn"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? '上传中…' : '⬆ 上传'}
                </button>
              </div>
              {!sourcesLoading && !sourcesError && filteredSources.length === 0 && (
                <div className="fl-empty">暂无文件，点「上传」添加资料</div>
              )}
              {filteredSources.map((f) => renderSourceItem(f, 'personal'))}

              {/* ── 课程资料（全班共享；学生只读，admin 可维护）── */}
              <div className="fl-src-group-header">
                <span>课程资料（共享）</span>
                {me?.role === 'admin' && (
                  <button
                    className="fl-upload-btn"
                    disabled={uploading}
                    onClick={() => courseFileInputRef.current?.click()}
                  >
                    {uploading ? '上传中…' : '⬆ 上传'}
                  </button>
                )}
              </div>
              {!sourcesLoading && !sourcesError && filteredCourseSources.length === 0 && (
                <div className="fl-empty">暂无课程资料</div>
              )}
              {filteredCourseSources.map((f) => renderSourceItem(f, 'course'))}
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
              {sortedTypes.map((type) => (
                <div key={type} className="fl-wiki-group">
                  <div className="fl-wiki-group-header">
                    <span className={`fl-badge ${WIKI_TYPE_CLASS[type] ?? 'badge-muted'}`}>
                      {WIKI_TYPE_LABEL[type] ?? '未分类'}
                    </span>
                    <span className="fl-wiki-group-count">{wikiByType[type].length}</span>
                  </div>
                  {wikiByType[type].map((f, idx) => {
                    const isActive = selected?.abs_path !== '' && selected?.abs_path === f.abs_path
                    const itemKey = f.abs_path || `${type}-${idx}`
                    return (
                      <button
                        key={itemKey}
                        className={`fl-item${isActive ? ' active' : ''}`}
                        onClick={() => openFile(f.abs_path, f.title || f.rel_path || '')}
                      >
                        <div className="fl-item-top">
                          <span className="fl-item-name" title={f.rel_path ?? ''}>
                            {f.layer === 'course' && <span className="fl-tag fl-tag-course">课程</span>}
                            {f.title || basename(f.rel_path ?? '')}
                          </span>
                          {f.date && (
                            <span className="fl-item-date">{String(f.date).slice(0, 10)}</span>
                          )}
                        </div>
                        {(f.tags ?? []).length > 0 && (
                          <div className="fl-item-tags">
                            {(f.tags ?? []).slice(0, 4).map((t) => (
                              <span key={t} className="fl-tag">{t}</span>
                            ))}
                          </div>
                        )}
                        <div className="fl-item-meta">
                          {f.layer === 'course' ? '课程共享' : '个人'} · {f.rel_path}
                        </div>
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
