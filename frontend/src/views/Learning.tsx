import { useEffect, useRef, useState } from 'react'
import MessageContent from '../components/MessageContent'
import {
  generateClassSummary, getClassSummaries, getStudentAttachmentUrl,
  getStudentSession, getStudentSessions, getStudents, resolveWiki,
  type ClassSummary, type LearningSession, type SessionSummary, type StudentOverview,
} from '../api/client'
import './Learning.css'

const date = (value: string | null) => value ? value.replace('T', ' ').slice(0, 19) : '暂无记录'
const shortDate = (value: string | null) => value ? value.slice(5, 10).replace('-', '/') : '—'
const errorText = (error: unknown) => error instanceof Error ? error.message : '加载失败，请重试'
const statusLabels = { completed: '已完成', failed: '回答失败', cancelled: '已停止', running: '回答中' }

const iconPaths = {
  students: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3M8 7h8M8 11h6',
  search: 'm21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3',
  refresh: 'M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 19.5 9M4.5 15a8 8 0 0 0 13.4 2.9',
  attachment: 'm21 11-8.5 8.5a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8L15 6',
}
function Icon({ name }: { name: keyof typeof iconPaths }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name]} /></svg>
}

function EmptyState({ title, detail, loading = false }: { title: string; detail?: string; loading?: boolean }) {
  return <div className="lr-empty" role={loading ? 'status' : undefined}>
    <span className={`lr-empty-icon${loading ? ' lr-loading' : ''}`}><Icon name={loading ? 'refresh' : 'book'} /></span>
    <strong>{title}</strong>{detail && <p>{detail}</p>}
  </div>
}

function SessionRecord({ student, sessionId, onBack }: { student: StudentOverview; sessionId: string; onBack: () => void }) {
  const [session, setSession] = useState<LearningSession | null>(null)
  const [error, setError] = useState('')
  const [showAnswers, setShowAnswers] = useState(true)
  useEffect(() => {
    let active = true
    getStudentSession(student.user_id, sessionId)
      .then(data => { if (active) setSession(data.session) })
      .catch(error => { if (active) setError(errorText(error)) })
    return () => { active = false }
  }, [student.user_id, sessionId])

  const openRef = (target: string) => {
    resolveWiki(target)
      .then(page => window.dispatchEvent(new CustomEvent('frankie-open-wiki', { detail: page })))
      .catch(error => setError(errorText(error)))
  }
  return (
    <section className="lr-reader" aria-label="问答记录">
      <header className="lr-reader-toolbar">
        <button className="lr-button lr-mobile-only" onClick={onBack}><Icon name="left" />会话列表</button>
        <span className="lr-eyebrow">问答记录 <span className="lr-dot">·</span> 只读</span>
        <button className="lr-button lr-text-button" aria-pressed={!showAnswers} onClick={() => setShowAnswers(value => !value)}>
          {showAnswers ? '只看提问' : '显示回答'}
        </button>
      </header>
      <div className="lr-reader-scroll" tabIndex={0} aria-label="问答内容">
        {error && <p className="lr-error" role="alert">{error}</p>}
        {!session && !error && <EmptyState loading title="正在加载问答记录" />}
        {session && <>
          <div className="lr-document-heading">
            <span className="lr-kicker">SESSION RECORD</span>
            <h2>{session.topic || '会话记录'}</h2>
            <p>{date(session.created_at)}<span className="lr-dot">·</span>{session.turns.length} 次提问</p>
          </div>
          {!session.turns.length && <EmptyState title="此会话暂无问答" />}
          {session.turns.map((turn, index) => (
            <article className="lr-turn" key={turn.turn_id}>
              <div className="lr-turn-meta">
                <span className="lr-turn-number">{String(index + 1).padStart(2, '0')}</span>
                <span>学生提问</span><time>{date(turn.started_at)}</time>
                <span className={`lr-status lr-status-${turn.status}`}>{statusLabels[turn.status]}</span>
              </div>
              <div className="lr-question"><MessageContent content={turn.user_text} onOpenRef={openRef} /></div>
              {!!turn.attachments.length && <ul className="lr-attachments">
                {turn.attachments.map(file => <li key={file.id}>
                  <a href={getStudentAttachmentUrl(student.user_id, file.id)} target="_blank" rel="noreferrer"><Icon name="attachment" />{file.name}</a>
                </li>)}
              </ul>}
              {showAnswers && <div className="lr-answer">
                <h3><span className="lr-answer-mark">F</span>助教回答</h3>
                {turn.assistant_text
                  ? <MessageContent content={turn.assistant_text} onOpenRef={openRef} />
                  : <p className="lr-muted">暂无已保存的回答。</p>}
                {turn.error && <p className="lr-error">{turn.error}</p>}
              </div>}
            </article>
          ))}
          <p className="lr-endnote">— 本次会话记录完毕 —</p>
        </>}
      </div>
    </section>
  )
}

function StudentRecords({ student, onBack }: { student: StudentOverview; onBack: () => void }) {
  const [offset, setOffset] = useState(0)
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [selected, setSelected] = useState('')
  const [showRecord, setShowRecord] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getStudentSessions(student.user_id, offset)
      .then(data => {
        if (active) {
          setSessions(data.sessions)
          setSelected(data.sessions[0]?.session_id || '')
        }
      })
      .catch(error => { if (active) setError(errorText(error)) })
    return () => { active = false }
  }, [student.user_id, offset])
  const changePage = (next: number) => {
    setOffset(next); setSessions(null); setSelected(''); setError('')
  }
  return (
    <section className="lr-student-detail" data-mobile-view={showRecord ? 'record' : 'sessions'} aria-label={`${student.display_name}的学习记录`}>
      <header className="lr-profile">
        <button className="lr-button lr-mobile-only" onClick={onBack}><Icon name="left" />学生列表</button>
        <span className="lr-avatar lr-avatar-large">{student.display_name.slice(0, 1).toUpperCase()}</span>
        <div className="lr-profile-name"><h2>{student.display_name}</h2><p>{student.user_id}</p></div>
        <div className="lr-profile-stat"><strong>{student.question_count}</strong><span>次提问</span></div>
        <div className="lr-profile-stat"><strong>{student.session_count}</strong><span>个会话</span></div>
      </header>
      <div className="lr-session-workspace">
        <aside className="lr-sessions" aria-label="会话列表">
          <div className="lr-pane-heading"><h3>全部会话</h3><span>最近更新优先</span></div>
          <div className="lr-session-scroll">
            {error && <p className="lr-error" role="alert">{error}</p>}
            {!sessions && !error && <EmptyState loading title="正在加载会话" />}
            {sessions?.length === 0 && <EmptyState title="暂无会话" detail="学生开始提问后，记录会出现在这里。" />}
            {sessions?.map(session => <button
              className="lr-session-item" key={session.session_id} aria-pressed={selected === session.session_id}
              onClick={() => { setSelected(session.session_id); setShowRecord(true) }}
            >
              <span className="lr-session-date"><Icon name="book" />{date(session.updated_at)}</span>
              <strong>{session.topic || '新会话'}</strong>
              <span className="lr-session-footer">{session.message_count} 条消息<Icon name="right" /></span>
            </button>)}
          </div>
          <div className="lr-pagination">
            <button className="lr-button lr-icon-button" aria-label="上一页会话" disabled={!offset} onClick={() => changePage(Math.max(0, offset - 50))}><Icon name="left" /></button>
            <span>第 {offset / 50 + 1} 页</span>
            <button className="lr-button lr-icon-button" aria-label="下一页会话" disabled={sessions?.length !== 50} onClick={() => changePage(offset + 50)}><Icon name="right" /></button>
          </div>
        </aside>
        {selected
          ? <SessionRecord key={selected} student={student} sessionId={selected} onBack={() => setShowRecord(false)} />
          : <div className="lr-reader lr-reader-placeholder"><EmptyState title={sessions?.length === 0 ? '还没有学习记录' : '选择一段会话'} detail="在这里查看学生的提问与助教的讲解。" /></div>}
      </div>
    </section>
  )
}

function Students() {
  const [students, setStudents] = useState<StudentOverview[] | null>(null)
  const [selected, setSelected] = useState<StudentOverview | null>(null)
  const [search, setSearch] = useState('')
  const [showStudent, setShowStudent] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getStudents().then(data => {
      if (active) {
        const ordered = [...data.students].sort((a, b) => (b.last_active_at || '').localeCompare(a.last_active_at || ''))
        setStudents(ordered)
        setSelected(ordered[0] || null)
      }
    }).catch(error => { if (active) setError(errorText(error)) })
    return () => { active = false }
  }, [])
  const query = search.trim().toLocaleLowerCase()
  const filtered = students?.filter(student => `${student.display_name} ${student.user_id}`.toLocaleLowerCase().includes(query))
  return (
    <div className="lr-students-view">
      <div className="lr-overview" aria-label="全班记录概览">
        <div><Icon name="students" /><strong>{students?.length ?? '—'}</strong><span>位学生</span></div>
        <div><Icon name="book" /><strong>{students ? students.reduce((sum, student) => sum + student.question_count, 0).toLocaleString() : '—'}</strong><span>次累计提问</span></div>
        <div><span className="lr-activity-dot" /><strong>{students?.filter(student => student.question_count > 0).length ?? '—'}</strong><span>位有提问记录</span></div>
        <p>已保存的 Chat 记录<span className="lr-dot">·</span>服务器时间</p>
      </div>
      <div className="lr-workspace" data-mobile-view={showStudent ? 'detail' : 'roster'}>
        <aside className="lr-roster" aria-label="学生列表">
          <div className="lr-roster-heading"><h2>学生</h2><span>{filtered?.length ?? 0} 位</span></div>
          <label className="lr-search"><Icon name="search" /><input aria-label="搜索学生" placeholder="搜索姓名或学号" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <div className="lr-roster-caption"><span>最近提问优先</span><span>提问数</span></div>
          <div className="lr-roster-scroll">
            {error && <p className="lr-error" role="alert">{error}</p>}
            {!students && !error && <EmptyState loading title="正在加载学生" />}
            {filtered?.length === 0 && <EmptyState title={students?.length ? '未找到学生' : '暂无学生账号'} detail={students?.length ? '试试其他姓名或学号。' : undefined} />}
            {filtered?.map(student => <button className="lr-student-item" key={student.user_id} aria-pressed={selected?.user_id === student.user_id} onClick={() => { setSelected(student); setShowStudent(true) }}>
              <span className="lr-avatar">{student.display_name.slice(0, 1).toUpperCase()}</span>
              <span className="lr-student-name"><strong>{student.display_name}</strong><small>{student.user_id}</small></span>
              <span className="lr-student-count"><strong>{student.question_count}</strong><small>{shortDate(student.last_active_at)}</small></span>
            </button>)}
          </div>
          <div className="lr-roster-footnote">选择学生，即刻查看右侧学习记录</div>
        </aside>
        {selected
          ? <StudentRecords key={selected.user_id} student={selected} onBack={() => setShowStudent(false)} />
          : <div className="lr-student-detail"><EmptyState title="学生学习记录" detail="选择一位学生，了解他们问了什么。" /></div>}
      </div>
    </div>
  )
}

function Summaries() {
  const [summaries, setSummaries] = useState<ClassSummary[] | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [showReport, setShowReport] = useState(false)
  const readerRef = useRef<HTMLDivElement>(null)
  useEffect(() => { readerRef.current?.scrollTo(0, 0) }, [selectedId])
  useEffect(() => {
    let active = true
    getClassSummaries().then(data => {
      if (active) {
        setSummaries(data.summaries)
        setSelectedId(data.summaries[0]?.id || '')
      }
    }).catch(error => { if (active) setError(errorText(error)) })
    return () => { active = false }
  }, [revision])

  const generate = async () => {
    setGenerating(true); setError('')
    try {
      const { summary } = await generateClassSummary()
      setSummaries(current => [summary, ...(current || [])])
      setSelectedId(summary.id)
      setShowReport(true)
    } catch (error) {
      setError(errorText(error))
    } finally { setGenerating(false) }
  }
  const selected = summaries?.find(summary => summary.id === selectedId)
  return (
    <section className="lr-summaries-view">
      <div className="lr-summary-actions">
        <p><Icon name="spark" />从学生提问中，发现值得关注的共性问题。</p>
        <div className="lr-actions">
          <button className="lr-button" disabled={generating} onClick={() => { setError(''); setSummaries(null); setRevision(value => value + 1) }}><Icon name="refresh" />刷新</button>
          <button className="lr-button lr-primary" disabled={generating || !summaries} onClick={() => void generate()}>
            <Icon name="spark" />{generating ? '正在生成并保存…' : '生成新摘要'}
          </button>
        </div>
      </div>
      {error && <p className="lr-error" role="alert">{error}</p>}
      <div className="lr-summary-workspace" data-mobile-view={showReport ? 'report' : 'list'}>
        <aside className="lr-summary-index" aria-label="摘要列表">
          <div className="lr-pane-heading"><h3>报告归档</h3><span>{summaries?.length ?? 0} 份</span></div>
          <div className="lr-session-scroll">
            {!summaries && !error && <EmptyState loading title="正在加载摘要" />}
            {summaries?.length === 0 && <EmptyState title="还没有报告" detail="点击「生成新摘要」创建第一份学情报告。" />}
            {summaries?.map(summary => <button className="lr-session-item" key={summary.id} aria-pressed={summary.id === selectedId} onClick={() => { setSelectedId(summary.id); setShowReport(true) }}>
              <span className="lr-session-date"><Icon name="book" />{date(summary.created_at)}</span>
              <strong>全班问题摘要</strong>
              <span className="lr-session-footer">{summary.question_count} 次提问 · {summary.student_count} 位学生<Icon name="right" /></span>
            </button>)}
          </div>
          <div className="lr-summary-note">每份报告仅分析上次截止时间后的新提问，不含助教回答。生成期间可离开页面，稍后刷新查看。</div>
        </aside>
        <section className="lr-reader">
          <header className="lr-reader-toolbar">
            <button className="lr-button lr-mobile-only" onClick={() => setShowReport(false)}><Icon name="left" />报告归档</button>
            <span className="lr-eyebrow">全班问题摘要</span><span className="lr-saved-badge">{selected ? '已保存' : '按需生成'}</span>
          </header>
          <div className="lr-reader-scroll" ref={readerRef} tabIndex={0} aria-label="摘要内容">
            {selected ? <article className="lr-report">
              <div className="lr-document-heading">
                <span className="lr-kicker">CLASS LEARNING REPORT</span><h2>全班问题摘要</h2>
                <p>生成于 {date(selected.created_at)}</p>
              </div>
              <div className="lr-report-facts">
                <div><strong>{selected.question_count}</strong><span>次学生提问</span></div>
                <div><strong>{selected.student_count}</strong><span>位参与学生</span></div>
              </div>
              <p className="lr-report-range">覆盖时间：{selected.window_start ? date(selected.window_start) + ' 之后' : '最早记录'} → {date(selected.window_end)}（含）<br />服务器时间 · AI 生成，请结合原始提问核对。</p>
              <MessageContent content={selected.content} />
            </article> : <EmptyState title="把提问变成教学洞察" detail="生成或选择一份报告，在这里查看全班的知识点与共性困惑。" />}
          </div>
        </section>
      </div>
    </section>
  )
}

export default function Learning() {
  const [section, setSection] = useState<'students' | 'summaries'>('students')
  return (
    <div className="learning-page">
      <header className="lr-page-header">
        <div><span className="lr-kicker">TEACHING INSIGHTS</span><h1>学习情况<span className="lr-admin-label">管理员</span></h1></div>
        <nav className="lr-tabs" aria-label="学情分析栏目">
          <button aria-pressed={section === 'students'} onClick={() => setSection('students')}><Icon name="students" />学生问答记录</button>
          <button aria-pressed={section === 'summaries'} onClick={() => setSection('summaries')}><Icon name="spark" />全班问题摘要</button>
        </nav>
      </header>
      {section === 'students' ? <Students /> : <Summaries />}
    </div>
  )
}
