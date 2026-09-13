import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import {
  errorMessage, generateClassSummary, getClassSummaries, getStudentAttachmentUrl,
  getStudentSession, getStudentSessions, getStudents,
  type ClassSummary, type LearningSession, type SessionSummary, type StudentOverview,
} from '../api/client'
import { formatDateTime, formatShortDate, numberFormatter } from '../lib/dates'
import { followRoute, getRoute, navigate, routeHref, useRoute } from '../lib/router'
import './Learning.css'

const statusLabels = { completed: '已完成', failed: '回答失败', cancelled: '已停止', running: '回答中' }
const statusBadges = { completed: 'badge-success', failed: 'badge-danger', cancelled: 'badge-warning', running: 'badge-accent' }
const friendlyError = (error: unknown, fallback: string) => errorMessage(error, fallback)

function EmptyState({ title, loading = false }: { title: string; loading?: boolean }) {
  return <div className="lr-empty" role={loading ? 'status' : undefined}>
    {loading ? <><Icon name="loader" className="spin" /><span className="visually-hidden">{title}</span></> : <p>{title}</p>}
  </div>
}

function SessionRecord({ student, sessionId, active }: { student: StudentOverview; sessionId: string; active: boolean }) {
  const route = useRoute()
  const [session, setSession] = useState<LearningSession | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const showAnswers = route.showAnswers !== false
  const backRef = useRef<HTMLAnchorElement>(null)
  useLayoutEffect(() => { if (active && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true }) }, [active])
  useEffect(() => {
    let current = true
    getStudentSession(student.user_id, sessionId)
      .then((data) => { if (current) { setSession(data.session); setError(''); setLoading(false) } })
      .catch((failure) => { if (current) { setError(friendlyError(failure, '无法加载问答记录，请重试。')); setLoading(false) } })
    return () => { current = false }
  }, [student.user_id, sessionId, revision])
  const backRoute = { ...route, learningPane: 'sessions' as const }
  return <section className="lr-reader" aria-labelledby="learning-record-title">
    <header className="lr-reader-toolbar">
      <a ref={backRef} className="btn-icon lr-mobile-only" aria-label="返回会话列表" href={routeHref(backRoute)} onClick={(event) => followRoute(event, backRoute)}><Icon name="chevron-left" size={18} /></a>
      <div className="lr-reader-context"><strong>{student.display_name}</strong><span title={session?.topic || '会话记录'}>{session?.topic || '问答记录'}</span></div>
      <button type="button" className="btn btn-ghost btn-sm" aria-pressed={!showAnswers} onClick={() => navigate({ ...route, showAnswers: showAnswers ? false : undefined }, { replace: true })}>{showAnswers ? '只看提问' : '显示回答'}</button>
    </header>
    <div className="lr-reader-scroll" tabIndex={0} aria-label="问答内容" aria-busy={loading}>
      <h2 id="learning-record-title" className="visually-hidden">问答记录</h2>
      {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setSession(null); setLoading(true); setRevision((value) => value + 1) }}>重试</button></div>}
      {loading && <EmptyState loading title="正在加载问答记录…" />}
      {session && <div className="lr-document">
        {!session.turns.length && <EmptyState title="此会话暂无问答" />}
        {session.turns.map((turn, index) => <article className="lr-turn content-auto" key={turn.turn_id}>
          <div className="lr-turn-meta"><span className="lr-turn-number">{numberFormatter.format(index + 1)}</span><span>学生提问</span><time dateTime={turn.started_at}>{formatDateTime(turn.started_at)}</time><span className={`badge ${statusBadges[turn.status]}`}>{statusLabels[turn.status]}</span></div>
          <div className="lr-question"><MessageContent content={turn.user_text} /></div>
          {!!turn.attachments.length && <ul className="lr-attachments">{turn.attachments.map((file) => <li key={file.id}><a href={getStudentAttachmentUrl(student.user_id, file.id)} target="_blank" rel="noreferrer"><Icon name="paperclip" size={18} />{file.name}</a></li>)}</ul>}
          {showAnswers && <section className="lr-answer" aria-labelledby={`answer-${turn.turn_id}`}><h3 id={`answer-${turn.turn_id}`}>助教回答</h3>{turn.assistant_text ? <MessageContent content={turn.assistant_text} /> : <p className="lr-muted">暂无已保存的回答。</p>}{turn.error && <p className="lr-error">回答未完成，请查看状态后重新提问。</p>}</section>}
        </article>)}
      </div>}
    </div>
  </section>
}

function StudentRecords({ student, screen }: { student: StudentOverview; screen: 'roster' | 'sessions' | 'record' }) {
  const route = useRoute()
  const offset = route.offset ?? 0
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const selected = route.learningSession || sessions?.[0]?.session_id || ''
  const backRef = useRef<HTMLAnchorElement>(null)
  useLayoutEffect(() => {
    if (screen === 'sessions' && !route.learningSession && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true })
  }, [route.learningSession, screen])
  useEffect(() => {
    let current = true
    getStudentSessions(student.user_id, offset)
      .then((data) => { if (current) { setSessions(data.sessions); setError(''); setLoading(false) } })
      .catch((failure) => { if (current) { setError(friendlyError(failure, '无法加载学生会话，请重试。')); setLoading(false) } })
    return () => { current = false }
  }, [student.user_id, offset, revision])
  const studentsRoute = { ...route, student: undefined, learningSession: undefined, learningPane: undefined, offset: undefined }
  return <>
    <aside className="lr-navigation lr-sessions" aria-label={`${student.display_name}的会话列表`}>
      <header className="lr-pane-heading"><a ref={backRef} className="btn-icon lr-mobile-only" aria-label="返回学生列表" href={routeHref(studentsRoute)} onClick={(event) => followRoute(event, studentsRoute)}><Icon name="chevron-left" size={18} /></a><h2>{student.display_name}</h2></header>
      <p className="lr-pane-meta">{numberFormatter.format(student.session_count)} 个会话 · {numberFormatter.format(student.question_count)} 次提问</p>
      <div className="lr-session-scroll" aria-busy={loading}>
        {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setSessions(null); setLoading(true); setRevision((value) => value + 1) }}>重试</button></div>}
        {loading && <EmptyState loading title="正在加载会话…" />}
        {sessions?.length === 0 && <EmptyState title="暂无会话" />}
        {sessions?.map((session) => {
          const destination = { ...route, student: student.user_id, learningSession: session.session_id, learningPane: 'record' as const }
          return <a data-learning-session={session.session_id} className="list-item lr-session-item content-auto" key={session.session_id} aria-current={selected === session.session_id ? 'page' : undefined} href={routeHref(destination)} title={session.topic || '新会话'} onClick={(event) => followRoute(event, destination)}><strong>{session.topic || '新会话'}</strong><span className="lr-session-footer"><time dateTime={session.updated_at}>{formatDateTime(session.updated_at)}</time><span>{numberFormatter.format(session.message_count)} 条消息</span></span></a>
        })}
      </div>
      <div className="lr-pagination">
        <a className={`btn-icon${!offset ? ' is-disabled' : ''}`} aria-label="上一页会话" aria-disabled={!offset} href={routeHref({ ...route, offset: Math.max(0, offset - 50) || undefined, learningSession: undefined, learningPane: 'sessions' })} onClick={(event) => { if (!offset) { event.preventDefault(); return } followRoute(event, { ...route, offset: Math.max(0, offset - 50) || undefined, learningSession: undefined, learningPane: 'sessions' }) }}><Icon name="chevron-left" size={18} /></a>
        <span>第 {numberFormatter.format(offset / 50 + 1)} 页</span>
        <a className={`btn-icon${sessions?.length !== 50 ? ' is-disabled' : ''}`} aria-label="下一页会话" aria-disabled={sessions?.length !== 50} href={routeHref({ ...route, offset: offset + 50, learningSession: undefined, learningPane: 'sessions' })} onClick={(event) => { if (sessions?.length !== 50) { event.preventDefault(); return } followRoute(event, { ...route, offset: offset + 50, learningSession: undefined, learningPane: 'sessions' }) }}><Icon name="chevron-right" size={18} /></a>
      </div>
    </aside>
    {selected ? <SessionRecord key={selected} student={student} sessionId={selected} active={screen === 'record'} /> : <div className="lr-reader"><EmptyState title={sessions?.length === 0 ? '暂无问答记录' : '选择会话查看问答记录'} /></div>}
  </>
}

function Students() {
  const route = useRoute()
  const [students, setStudents] = useState<StudentOverview[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let current = true
    getStudents().then((data) => { if (current) { setStudents([...data.students].sort((a, b) => (b.last_active_at || '').localeCompare(a.last_active_at || ''))); setError(''); setLoading(false) } })
      .catch((failure) => { if (current) { setError(friendlyError(failure, '无法加载学生列表，请重试。')); setLoading(false) } })
    return () => { current = false }
  }, [revision])
  const search = route.studentSearch ?? ''
  const query = useDeferredValue(search).trim().toLocaleLowerCase()
  const filtered = useMemo(() => students?.filter((student) => `${student.display_name} ${student.user_id}`.toLocaleLowerCase().includes(query)), [students, query])
  const selected = students?.find((student) => student.user_id === route.student) || students?.[0] || null
  const screen = !route.student ? 'roster' : route.learningPane === 'sessions' || !route.learningSession ? 'sessions' : 'record'
  const previousRoute = useRef({ screen, student: route.student, session: route.learningSession })
  useLayoutEffect(() => {
    const previous = previousRoute.current
    if (screen === 'roster' && previous.student) {
      const target = document.querySelector<HTMLAnchorElement>(`[data-student-id="${CSS.escape(previous.student)}"]`)
        ?? document.querySelector<HTMLInputElement>('[name="student-search"]')
      target?.focus({ preventScroll: true })
    } else if (screen === 'sessions' && previous.screen === 'record' && previous.session) {
      document.querySelector<HTMLAnchorElement>(`[data-learning-session="${CSS.escape(previous.session)}"]`)?.focus({ preventScroll: true })
    }
    previousRoute.current = { screen, student: route.student, session: route.learningSession }
  }, [screen, route.student, route.learningSession])
  return <div className="panel lr-workspace lr-students-workspace" data-screen={screen}>
    <aside className="lr-navigation lr-roster" aria-label="学生列表">
      <header className="lr-pane-heading"><h2>学生</h2><span className="lr-muted">{numberFormatter.format(filtered?.length ?? 0)} 位</span></header>
      <label className="search focus-field lr-search"><Icon name="search" size={16} /><input name="student-search" autoComplete="off" aria-label="搜索学生" placeholder="搜索姓名或学号，如 20260001…" value={search} onChange={(event) => navigate({ ...route, studentSearch: event.target.value || undefined }, { replace: true })} /></label>
      <span className="visually-hidden" role="status">{query ? `找到 ${numberFormatter.format(filtered?.length ?? 0)} 位学生` : ''}</span>
      <div className="lr-roster-caption"><span>最近提问优先</span><span>提问数</span></div>
      <div className="lr-session-scroll" aria-busy={loading}>
        {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setStudents(null); setLoading(true); setRevision((value) => value + 1) }}>重试</button></div>}
        {loading && <EmptyState loading title="正在加载学生…" />}
        {filtered?.length === 0 && <EmptyState title={students?.length ? '未找到学生' : '暂无学生账号'} />}
        {filtered?.map((student) => {
          const destination = { ...route, student: student.user_id, learningSession: undefined, learningPane: 'sessions' as const, offset: undefined }
          return <a data-student-id={student.user_id} className="list-item lr-student-item content-auto" key={student.user_id} aria-current={selected?.user_id === student.user_id ? 'true' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}><span className="lr-student-name"><strong>{student.display_name}</strong><small translate="no">{student.user_id}</small></span><span className="lr-student-count"><strong>{numberFormatter.format(student.question_count)}</strong><small>{formatShortDate(student.last_active_at)}</small></span></a>
        })}
      </div>
    </aside>
    {selected ? <StudentRecords key={`${selected.user_id}:${route.offset ?? 0}`} student={selected} screen={screen} /> : <div className="lr-reader"><EmptyState title="选择学生查看问答记录" /></div>}
  </div>
}

function Summaries() {
  const route = useRoute()
  const [summaries, setSummaries] = useState<ClassSummary[] | null>(null)
  const [summariesLoading, setSummariesLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const backRef = useRef<HTMLAnchorElement>(null)
  const readerRef = useRef<HTMLDivElement>(null)
  const previousSummary = useRef(route.summary)
  const mounted = useRef(true)
  const generationRequest = useRef(0)
  useLayoutEffect(() => { readerRef.current?.scrollTo(0, 0) }, [route.summary])
  useLayoutEffect(() => {
    const previous = previousSummary.current
    if (route.summary && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true })
    else if (!route.summary && previous) document.querySelector<HTMLAnchorElement>(`[data-summary-id="${CSS.escape(previous)}"]`)?.focus({ preventScroll: true })
    previousSummary.current = route.summary
  }, [route.summary])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; generationRequest.current += 1 }
  }, [])
  useEffect(() => {
    let current = true
    getClassSummaries().then((data) => { if (current) { setSummaries(data.summaries); setError(''); setSummariesLoading(false) } })
      .catch((failure) => { if (current) { setError(friendlyError(failure, '无法加载摘要，请重试。')); setSummariesLoading(false) } })
    return () => { current = false }
  }, [revision])
  const selected = summaries?.find((summary) => summary.id === route.summary) || summaries?.[0]
  const refresh = () => {
    if (summariesLoading) return
    setError('')
    setSummariesLoading(true)
    setRevision((value) => value + 1)
  }
  const generate = async () => {
    if (generating || summariesLoading) return
    const origin = getRoute()
    const request = ++generationRequest.current
    setGenerating(true); setError(''); setAnnouncement('正在生成全班问题摘要，请稍候。')
    try {
      const { summary } = await generateClassSummary()
      if (!mounted.current || generationRequest.current !== request) return
      setSummaries((items) => [summary, ...(items || [])])
      setAnnouncement('全班问题摘要已生成。')
      const current = getRoute()
      if (current.entryKey === origin.entryKey && current.view === 'learning' && current.learningSection === 'summaries' && current.summary === origin.summary) {
        navigate({ ...current, summary: summary.id })
      }
    } catch (failure) {
      if (!mounted.current || generationRequest.current !== request) return
      setError(friendlyError(failure, '摘要生成失败，请稍后重试。'))
      setAnnouncement('摘要生成失败。')
    } finally {
      if (mounted.current && generationRequest.current === request) setGenerating(false)
    }
  }
  return <section className="lr-summaries-view" aria-labelledby="learning-summary-title">
    <span className="visually-hidden" role="status">{announcement}</span>
    {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={summariesLoading} onClick={refresh}>重试</button></div>}
    <div className="panel lr-workspace lr-summary-workspace" data-screen={route.summary ? 'record' : 'summaries'}>
      <aside className="lr-navigation" aria-label="摘要列表">
        <header className="lr-pane-heading"><h2>问题摘要</h2><button type="button" className="btn btn-ghost btn-sm" disabled={generating || summariesLoading} onClick={refresh}>{summariesLoading && summaries ? <Icon name="loader" size={16} className="spin" /> : <Icon name="refresh" size={16} />}{summariesLoading && summaries ? '刷新中…' : '刷新'}</button></header>
        <div className="lr-summary-actions"><button type="button" className="btn btn-primary" disabled={generating || summariesLoading || !summaries} onClick={() => void generate()}>{generating && <Icon name="loader" size={16} className="spin" />}{generating ? '正在生成…' : '生成新摘要'}</button></div>
        <div className="lr-session-scroll" aria-busy={summariesLoading}>{!summaries && summariesLoading && <EmptyState loading title="正在加载摘要…" />}{summaries?.length === 0 && <EmptyState title="暂无摘要" />}{summaries?.map((summary) => {
          const destination = { ...route, summary: summary.id }
          return <a data-summary-id={summary.id} className="list-item lr-session-item content-auto" key={summary.id} aria-current={summary.id === selected?.id ? 'page' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}><strong>{formatDateTime(summary.created_at)}</strong><span className="lr-session-footer">{numberFormatter.format(summary.question_count)} 次提问 · {numberFormatter.format(summary.student_count)} 位学生</span></a>
        })}</div>
        <p className="lr-summary-note">根据新增学生提问生成。离开页面后可刷新查看结果。</p>
      </aside>
      <section className="lr-reader" aria-labelledby="learning-summary-title">
        <header className="lr-reader-toolbar"><a ref={backRef} className="btn-icon lr-mobile-only" aria-label="返回摘要列表" href={routeHref({ ...route, summary: undefined })} onClick={(event) => followRoute(event, { ...route, summary: undefined })}><Icon name="chevron-left" size={18} /></a><div className="lr-reader-context"><strong>全班问题摘要</strong>{selected && <span>{formatDateTime(selected.created_at)}</span>}</div></header>
        <div className="lr-reader-scroll" ref={readerRef} tabIndex={0} aria-label="摘要内容"><h2 id="learning-summary-title" className="visually-hidden">全班问题摘要报告</h2>{selected ? <article className="lr-report"><p className="lr-report-range">{numberFormatter.format(selected.question_count)} 次提问 · {numberFormatter.format(selected.student_count)} 位学生<br />{selected.window_start ? `${formatDateTime(selected.window_start)} 之后` : '最早记录'} 至 {formatDateTime(selected.window_end)}（含，服务器时间）</p><MessageContent content={selected.content} /><p className="lr-report-note">AI 生成，请结合原始提问核对。</p></article> : <EmptyState title="选择摘要查看内容" />}</div>
      </section>
    </div>
  </section>
}

export default function Learning({ navigation }: { navigation?: ReactNode }) {
  const route = useRoute()
  const section = route.learningSection ?? 'students'
  return <div className="learning-page">
    <header className="lr-toolbar">{navigation}<h1 className="visually-hidden">学习情况</h1><nav className="segmented" aria-label="学情分析栏目">
      <a aria-current={section === 'students' ? 'page' : undefined} href={routeHref({ ...route, learningSection: undefined })} onClick={(event) => followRoute(event, { ...route, learningSection: undefined })}>学生问答记录</a>
      <a aria-current={section === 'summaries' ? 'page' : undefined} href={routeHref({ ...route, learningSection: 'summaries' })} onClick={(event) => followRoute(event, { ...route, learningSection: 'summaries' })}>全班问题摘要</a>
    </nav></header>
    {section === 'students' ? <Students /> : <Summaries />}
  </div>
}
