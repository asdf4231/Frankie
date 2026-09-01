/**
 * Content — 内容管理视图（仅管理员）
 *
 * 布局：左侧文件树（管理文件 / 讲义 / Wiki），右侧 Markdown 编辑器 + 预览
 *
 * 保存 = 直接写盘，立即生效，无需重启。
 */

import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  getAdminContent,
  readAdminContent,
  saveAdminContent,
  type AdminContentFile,
} from '../api/client'

const CATEGORY_ORDER = ['管理文件', '讲义', 'Wiki']

export default function Content() {
  const [files, setFiles] = useState<AdminContentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await getAdminContent()
      setFiles(d.files)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function open(relPath: string) {
    try {
      const d = await readAdminContent(relPath)
      setSelected(relPath)
      setContent(d.content)
      setDirty(false)
      setPreview(false)
      setStatus(null)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    }
  }

  async function save() {
    if (!selected) return
    setBusy(true)
    setStatus('保存中…')
    try {
      await saveAdminContent(selected, content)
      setDirty(false)
      setStatus('✅ 已保存，立即生效')
      await reload()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const groups: Record<string, AdminContentFile[]> = {}
  for (const f of files) {
    ;(groups[f.category] ??= []).push(f)
  }

  return (
    <div className="file-library">
      {/* ── 左侧文件树 ───────────────────────────── */}
      <div className="fl-sidebar">
        <div className="fl-tabs">
          <button className="fl-tab active">🗂️ 内容管理</button>
        </div>
        <div className="fl-panel">
          {loading && <div className="loading-text">加载中…</div>}
          {error && <div className="error-text">{error}</div>}
          <div className="fl-list">
            {CATEGORY_ORDER.map((cat) =>
              groups[cat]?.length ? (
                <div key={cat} className="fl-wiki-group">
                  <div className="fl-wiki-group-header">
                    <span>{cat}</span>
                    <span className="fl-wiki-group-count">{groups[cat].length}</span>
                  </div>
                  {groups[cat].map((f) => (
                    <button
                      key={f.rel_path}
                      className={`fl-item${selected === f.rel_path ? ' active' : ''}`}
                      onClick={() => open(f.rel_path)}
                    >
                      <div className="fl-item-top">
                        <span className="fl-item-name" title={f.rel_path}>
                          {f.title || f.rel_path}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* ── 右侧编辑器 ──────────────────────────── */}
      <div className="fl-preview">
        {!selected && (
          <div className="fl-preview-empty">
            <div className="fl-preview-empty-icon">✏️</div>
            <div>选择左侧文件进行编辑</div>
          </div>
        )}
        {selected && (
          <>
            <div className="fl-preview-header">
              <span className="fl-preview-title" title={selected}>{selected}</span>
              <button
                className="fl-upload-btn"
                disabled={busy || !dirty}
                onClick={save}
                title="保存"
              >
                {busy ? '…' : '💾 保存'}
              </button>
              <button
                className="fl-upload-btn"
                onClick={() => setPreview((v) => !v)}
                title="切换编辑/预览"
              >
                {preview ? '✏️ 编辑' : '👁 预览'}
              </button>
            </div>
            {status && <div className="error-text" style={{ whiteSpace: 'pre-wrap', padding: '8px 16px' }}>{status}</div>}
            <div className="fl-preview-body">
              {preview ? (
                <div className="fl-md">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="content-editor"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setDirty(true)
                  }}
                  spellCheck={false}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
