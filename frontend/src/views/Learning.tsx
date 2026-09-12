import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import {
  generateClassSummary, getClassSummaries, getStudentAttachmentUrl,
  getStudentSession, getStudentSessions, getStudents,
  type ClassSummary, type LearningSession, type SessionSummary, type StudentOverview,
} from '../api/client'
import { navigate, viewForRelPath } from '../lib/router'
import { resolveReferenceCached } from '../lib/cache'
import './Learning.css'

const date = (value: string | null) => value ? value.replace('T', ' ').slice(0, 19) : '暂无记录'
const shortDate = (value: string | null) => value ? value.slice(5, 10).replace('-', '/') : '—'
const errorText = (error: unknown) => error instanceof Error ? error.message : '加载失败，请重试'
const statusLabels = { completed: '已完成', failed: '回答失败', cancelled: '已停止', running: '回答中' }
const statusBadges = { completed: 'badge-success', failed: 'badge-danger', cancelled: 'badge-warning', running: 'badge-accent' }

function EmptyState({ title, loading = false }: { title: string; loading?: boolean }) {
  return <div className="lr-empty" role={loading ? 'status' : undefined}>
    {loading ? <><Icon name="loader" className="spin" /><span className="visually-hidden">{title}</span></> : <p>{title}</p>}
  </div>
}

function SessionRecord({ student, sessionId, active, onBack }: { student: StudentOverview; sessionId: string; active: boolean; onBack: () => void }) {
  const [session, setSession] = useState<LearningSession | null>(null)
  const [error, setError] = useState('')
  const [showAnswers, setShowAnswers] = useState(true)
  const [linkError, setLinkError] = useState('')
  const backRef = useRef<HTMLButtonElement>(null)
  const linkRequest = useRef(0)
  useLayoutEffect(() => {
    if (active && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true })
  }, [active])
  useEffect(() => () => { linkRequest.current += 1 }, [])
  useEffect(() => {
    let active = true
    getStudentSession(student.user_id, sessionId)
      .then(data => { if (active) setSession(data.session) })
      .catch(error => { if (active) setError(errorText(error)) })
    return () => { active = false }
  }, [student.user_id, sessionId])

  const openRef = useCallback((target: string) => {
    const current = ++linkRequest.current
    setLinkError('')
    resolveReferenceCached(target)
      .then(page => { if (current === linkRequest.current) navigate({ view: viewForRelPath(page.rel_path), file: page.abs_path }) })
      .catch(error => { if (current === linkRequest.current) setLinkError(errorText(error)) })
  }, [])
  return (
    <section className="lr-reader" aria-label="问答记录">
      <header className="lr-reader-toolbar">
        <button ref={backRef} type="button" className="btn-icon lr-mobile-only" aria-label="返回会话列表" onClick={onBack}><Icon name="chevron-left" size={18} /></button>
        <div className="lr-reader-context"><strong>{student.display_name}</strong><span title={session?.topic || '会话记录'}>{session?.topic || '问答记录'}</span></div>
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={!showAnswers} onClick={() => setShowAnswers(value => !value)}>
          {showAnswers ? '只看提问' : '显示回答'}
        </button>
      </header>
      <div className="lr-reader-scroll" tabIndex={0} aria-label="问答内容">
        {error && <p className="lr-error" role="alert">{error}</p>}
        {linkError && <p className="lr-error" role="alert">{linkError}</p>}
        {!session && !error && <EmptyState loading title="正在加载问答记录" />}
        {session && <div className="lr-document">
          {!session.turns.length && <EmptyState title="此会话暂无问答" />}
          {session.turns.map((turn, index) => (
            <article className="lr-turn" key={turn.turn_id}>
              <div className="lr-turn-meta">
                <span className="lr-turn-number">{String(index + 1).padStart(2, '0')}</span>
                <span>学生提问</span><time>{date(turn.started_at)}</time>
                <span className={`badge ${statusBadges[turn.status]}`}>{statusLabels[turn.status]}</span>
              </div>
              <div className="lr-question"><MessageContent content={turn.user_text} onOpenRef={openRef} /></div>
              {!!turn.attachments.length && <ul className="lr-attachments">
                {turn.attachments.map(file => <li key={file.id}>
                  <a href={getStudentAttachmentUrl(student.user_id, file.id)} target="_blank" rel="noreferrer"><Icon name="paperclip" size={18} />{file.name}</a>
                </li>)}
              </ul>}
              {showAnswers && <div className="lr-answer">
                <h3>助教回答</h3>
                {turn.assistant_text
                  ? <MessageContent content={turn.assistant_text} onOpenRef={openRef} />
                  : <p className="lr-muted">暂无已保存的回答。</p>}
                {turn.error && <p className="lr-error">{turn.error}</p>}
              </div>}
            </article>
          ))}
        </div>}
      </div>
    </section>
  )
}

function StudentRecords({ student, active, onStudents, onRecord, onSessions }: {
  student: StudentOverview; active: boolean
  onStudents: () => void; onRecord: () => void; onSessions: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [selected, setSelected] = useState('')
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
    <>
      <aside className="lr-navigation lr-sessions" aria-label={`${student.display_name}的会话列表`}>
          <header className="lr-pane-heading">
            <button type="button" className="btn-icon lr-mobile-only" aria-label="返回学生列表" onClick={onStudents}><Icon name="chevron-left" size={18} /></button>
            <h2>{student.display_name}</h2>
          </header>
          <p className="lr-pane-meta">{student.session_count} 个会话 · {student.question_count} 次提问</p>
          <div className="lr-session-scroll">
            {error && <p className="lr-error" role="alert">{error}</p>}
            {!sessions && !error && <EmptyState loading title="正在加载会话" />}
            {sessions?.length === 0 && <EmptyState title="暂无会话" />}
            {sessions?.map(session => <button
              type="button" className="list-item lr-session-item" key={session.session_id} aria-current={selected === session.session_id ? 'page' : undefined}
              title={session.topic || '新会话'} onClick={() => { setSelected(session.session_id); onRecord() }}
            >
              <strong>{session.topic || '新会话'}</strong>
              <span className="lr-session-footer"><time>{date(session.updated_at)}</time><span>{session.message_count} 条消息</span></span>
            </button>)}
          </div>
          <div className="lr-pagination">
            <button type="button" className="btn-icon" aria-label="上一页会话" disabled={!offset} onClick={() => changePage(Math.max(0, offset - 50))}><Icon name="chevron-left" size={18} /></button>
            <span>第 {offset / 50 + 1} 页</span>
            <button type="button" className="btn-icon" aria-label="下一页会话" disabled={sessions?.length !== 50} onClick={() => changePage(offset + 50)}><Icon name="chevron-right" size={18} /></button>
          </div>
        </aside>
        {selected
          ? <SessionRecord key={selected} student={student} sessionId={selected} active={active} onBack={onSessions} />
          : <div className="lr-reader"><EmptyState title={sessions?.length === 0 ? '暂无问答记录' : '选择会话查看问答记录'} /></div>}
    </>
  )
}

function Students() {
  const [students, setStudents] = useState<StudentOverview[] | null>(null)
  const [selected, setSelected] = useState<StudentOverview | null>(null)
  const [search, setSearch] = useState('')
  const [screen, setScreen] = useState<'roster' | 'sessions' | 'record'>('roster')
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
  const query = useDeferredValue(search).trim().toLocaleLowerCase()
  const filtered = useMemo(() => students?.filter(student => `${student.display_name} ${student.user_id}`.toLocaleLowerCase().includes(query)), [students, query])
  const roster = (
        <aside className="lr-navigation lr-roster" aria-label="学生列表">
          <header className="lr-pane-heading"><h2>学生</h2><span className="lr-muted">{filtered?.length ?? 0} 位</span></header>
          <label className="search focus-field lr-search"><Icon name="search" size={16} /><input aria-label="搜索学生" placeholder="搜索姓名或学号" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <div className="lr-roster-caption"><span>最近提问优先</span><span>提问数</span></div>
          <div className="lr-session-scroll">
            {error && <p className="lr-error" role="alert">{error}</p>}
            {!students && !error && <EmptyState loading title="正在加载学生" />}
            {filtered?.length === 0 && <EmptyState title={students?.length ? '未找到学生' : '暂无学生账号'} />}
            {filtered?.map(student => <button type="button" className="list-item lr-student-item" key={student.user_id} aria-current={selected?.user_id === student.user_id ? 'true' : undefined} onClick={() => { setSelected(student); setScreen('sessions') }}>
              <span className="lr-student-name"><strong>{student.display_name}</strong><small>{student.user_id}</small></span>
              <span className="lr-student-count"><strong>{student.question_count}</strong><small>{shortDate(student.last_active_at)}</small></span>
            </button>)}
          </div>
        </aside>
  )
  return (
    <div className="panel lr-workspace lr-students-workspace" data-screen={screen}>
      {roster}
      {selected ? <StudentRecords
        key={selected.user_id} student={selected} active={screen === 'record'}
        onStudents={() => setScreen('roster')} onRecord={() => setScreen('record')} onSessions={() => setScreen('sessions')}
      /> : <div className="lr-reader"><EmptyState title="选择学生查看问答记录" /></div>}
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
  useLayoutEffect(() => { readerRef.current?.scrollTo(0, 0) }, [selectedId])
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
      {error && <p className="lr-error" role="alert">{error}</p>}
      <div className="panel lr-workspace lr-summary-workspace" data-screen={showReport ? 'record' : 'summaries'}>
        <aside className="lr-navigation" aria-label="摘要列表">
          <header className="lr-pane-heading">
            <h2>问题摘要</h2>
            <button type="button" className="btn btn-ghost btn-sm" disabled={generating || (!summaries && !error)} onClick={() => { setError(''); setSummaries(null); setRevision(value => value + 1) }}><Icon name="refresh" size={16} />刷新</button>
          </header>
          <div className="lr-summary-actions">
            <button type="button" className="btn btn-primary" disabled={generating || !summaries} onClick={() => void generate()}>
              {generating && <Icon name="loader" size={16} className="spin" />}{generating ? '正在生成…' : '生成新摘要'}
            </button>
          </div>
          <div className="lr-session-scroll">
            {!summaries && !error && <EmptyState loading title="正在加载摘要" />}
            {summaries?.length === 0 && <EmptyState title="暂无摘要" />}
            {summaries?.map(summary => <button type="button" className="list-item lr-session-item" key={summary.id} aria-current={summary.id === selectedId ? 'page' : undefined} onClick={() => { setSelectedId(summary.id); setShowReport(true) }}>
              <strong>{date(summary.created_at)}</strong>
              <span className="lr-session-footer">{summary.question_count} 次提问 · {summary.student_count} 位学生</span>
            </button>)}
          </div>
          <p className="lr-summary-note">根据新增学生提问生成。离开页面后可刷新查看结果。</p>
        </aside>
        <section className="lr-reader">
          <header className="lr-reader-toolbar">
            <button type="button" className="btn-icon lr-mobile-only" aria-label="返回摘要列表" onClick={() => setShowReport(false)}><Icon name="chevron-left" size={18} /></button>
            <div className="lr-reader-context"><strong>全班问题摘要</strong>{selected && <span>{date(selected.created_at)}</span>}</div>
          </header>
          <div className="lr-reader-scroll" ref={readerRef} tabIndex={0} aria-label="摘要内容">
            {selected ? <article className="lr-report">
              <p className="lr-report-range">{selected.question_count} 次提问 · {selected.student_count} 位学生<br />
                {selected.window_start ? date(selected.window_start) + ' 之后' : '最早记录'} 至 {date(selected.window_end)}（含，服务器时间）
              </p>
              <MessageContent content={selected.content} />
              <p className="lr-report-note">AI 生成，请结合原始提问核对。</p>
            </article> : <EmptyState title="选择摘要查看内容" />}
          </div>
        </section>
      </div>
    </section>
  )
}

export default function Learning({ navigation }: { navigation?: ReactNode }) {
  const [section, setSection] = useState<'students' | 'summaries'>('students')
  return (
    <div className="learning-page">
      <header className="lr-toolbar">
        {navigation}
        <h1 className="visually-hidden">学习情况</h1>
        <nav className="segmented" aria-label="学情分析栏目">
          <button type="button" aria-pressed={section === 'students'} onClick={() => setSection('students')}>学生问答记录</button>
          <button type="button" aria-pressed={section === 'summaries'} onClick={() => setSection('summaries')}>全班问题摘要</button>
        </nav>
      </header>
      {section === 'students' ? <Students /> : <Summaries />}
    </div>
  )
}
