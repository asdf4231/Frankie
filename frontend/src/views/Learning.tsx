import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import {
  errorMessage, generateClassSummary, getClassSummaries, getStudentAttachmentUrl,
  getStudentSession, getStudentSessions, getStudents,
  type ClassSummary, type LearningSession, type SessionSummary, type StudentOverview,
} from '../api/client'
import { formatCount, formatDateTime, formatShortDate, numberFormatter } from '../lib/dates'
import { followRoute, getRoute, navigate, routeHref, useRoute } from '../lib/router'
import './Learning.css'

const statusLabels = { completed: 'Completed', failed: 'Failed', cancelled: 'Stopped', running: 'Answering' }
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
      .catch((failure) => { if (current) { setError(friendlyError(failure, 'The Q&A record could not be loaded. Try again.')); setLoading(false) } })
    return () => { current = false }
  }, [student.user_id, sessionId, revision])
  const backRoute = { ...route, learningPane: 'sessions' as const }
  return <section className="lr-reader" aria-labelledby="learning-record-title">
    <header className="lr-reader-toolbar">
      <a ref={backRef} className="btn-icon lr-mobile-only" aria-label="Back to conversations" href={routeHref(backRoute)} onClick={(event) => followRoute(event, backRoute)}><Icon name="chevron-left" size={18} /></a>
      <div className="lr-reader-context"><strong>{student.display_name}</strong><span title={session?.topic || 'Conversation'}>{session?.topic || 'Q&A record'}</span></div>
      <button type="button" className="btn btn-ghost btn-sm" aria-pressed={!showAnswers} onClick={() => navigate({ ...route, showAnswers: showAnswers ? false : undefined }, { replace: true })}>{showAnswers ? 'Questions only' : 'Show answer'}</button>
    </header>
    <div className="lr-reader-scroll" tabIndex={0} aria-label="Q&A content" aria-busy={loading}>
      <h2 id="learning-record-title" className="visually-hidden">Q&A record</h2>
      {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setSession(null); setLoading(true); setRevision((value) => value + 1) }}>Retry</button></div>}
      {loading && <EmptyState loading title="Loading Q&A record…" />}
      {session && <div className="lr-document">
        {!session.turns.length && <EmptyState title="This conversation has no Q&A yet" />}
        {session.turns.map((turn, index) => <article className="lr-turn content-auto" key={turn.turn_id}>
          <div className="lr-turn-meta"><span className="lr-turn-number">{numberFormatter.format(index + 1)}</span><span>Student question</span><time dateTime={turn.started_at}>{formatDateTime(turn.started_at)}</time><span className={`badge ${statusBadges[turn.status]}`}>{statusLabels[turn.status]}</span></div>
          <div className="lr-question"><MessageContent content={turn.user_text} /></div>
          {!!turn.attachments.length && <ul className="lr-attachments">{turn.attachments.map((file) => <li key={file.id}><a href={getStudentAttachmentUrl(student.user_id, file.id)} target="_blank" rel="noreferrer"><Icon name="paperclip" size={18} />{file.name}</a></li>)}</ul>}
          {showAnswers && <section className="lr-answer" aria-labelledby={`answer-${turn.turn_id}`}><h3 id={`answer-${turn.turn_id}`}>Assistant answer</h3>{turn.assistant_text ? <MessageContent content={turn.assistant_text} /> : <p className="lr-muted">No saved answer.</p>}{turn.error && <p className="lr-error">The answer did not finish. Check its status and ask again.</p>}</section>}
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
      .catch((failure) => { if (current) { setError(friendlyError(failure, "The student's conversations could not be loaded. Try again.")); setLoading(false) } })
    return () => { current = false }
  }, [student.user_id, offset, revision])
  const studentsRoute = { ...route, student: undefined, learningSession: undefined, learningPane: undefined, offset: undefined }
  return <>
    <aside className="lr-navigation lr-sessions" aria-label={`${student.display_name}'s conversations`}>
      <header className="lr-pane-heading"><a ref={backRef} className="btn-icon lr-mobile-only" aria-label="Back to students" href={routeHref(studentsRoute)} onClick={(event) => followRoute(event, studentsRoute)}><Icon name="chevron-left" size={18} /></a><h2>{student.display_name}</h2></header>
      <p className="lr-pane-meta">{formatCount(student.session_count, 'conversation')} · {formatCount(student.question_count, 'question')}</p>
      <div className="lr-session-scroll" aria-busy={loading}>
        {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setSessions(null); setLoading(true); setRevision((value) => value + 1) }}>Retry</button></div>}
        {loading && <EmptyState loading title="Loading conversations…" />}
        {sessions?.length === 0 && <EmptyState title="No conversations yet" />}
        {sessions?.map((session) => {
          const destination = { ...route, student: student.user_id, learningSession: session.session_id, learningPane: 'record' as const }
          return <a data-learning-session={session.session_id} className="list-item lr-session-item content-auto" key={session.session_id} aria-current={selected === session.session_id ? 'page' : undefined} href={routeHref(destination)} title={session.topic || 'New chat'} onClick={(event) => followRoute(event, destination)}><strong>{session.topic || 'New chat'}</strong><span className="lr-session-footer"><time dateTime={session.updated_at}>{formatDateTime(session.updated_at)}</time><span>{formatCount(session.message_count, 'message')}</span></span></a>
        })}
      </div>
      <div className="lr-pagination">
        <a className={`btn-icon${!offset ? ' is-disabled' : ''}`} aria-label="Previous page" aria-disabled={!offset} href={routeHref({ ...route, offset: Math.max(0, offset - 50) || undefined, learningSession: undefined, learningPane: 'sessions' })} onClick={(event) => { if (!offset) { event.preventDefault(); return } followRoute(event, { ...route, offset: Math.max(0, offset - 50) || undefined, learningSession: undefined, learningPane: 'sessions' }) }}><Icon name="chevron-left" size={18} /></a>
        <span>Page {numberFormatter.format(offset / 50 + 1)}</span>
        <a className={`btn-icon${sessions?.length !== 50 ? ' is-disabled' : ''}`} aria-label="Next page" aria-disabled={sessions?.length !== 50} href={routeHref({ ...route, offset: offset + 50, learningSession: undefined, learningPane: 'sessions' })} onClick={(event) => { if (sessions?.length !== 50) { event.preventDefault(); return } followRoute(event, { ...route, offset: offset + 50, learningSession: undefined, learningPane: 'sessions' }) }}><Icon name="chevron-right" size={18} /></a>
      </div>
    </aside>
    {selected ? <SessionRecord key={selected} student={student} sessionId={selected} active={screen === 'record'} /> : <div className="lr-reader"><EmptyState title={sessions?.length === 0 ? 'No Q&A records' : 'Select a conversation to view its Q&A record'} /></div>}
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
      .catch((failure) => { if (current) { setError(friendlyError(failure, 'The student list could not be loaded. Try again.')); setLoading(false) } })
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
    <aside className="lr-navigation lr-roster" aria-label="Students">
      <header className="lr-pane-heading"><h2>Students</h2><span className="lr-muted">{formatCount(filtered?.length ?? 0, 'student')}</span></header>
      <label className="search focus-field lr-search"><Icon name="search" size={16} /><input name="student-search" autoComplete="off" aria-label="Search students" placeholder="Search by name or student ID, e.g. 20260001…" value={search} onChange={(event) => navigate({ ...route, studentSearch: event.target.value || undefined }, { replace: true })} /></label>
      <span className="visually-hidden" role="status">{query ? `${formatCount(filtered?.length ?? 0, 'student')} found` : ''}</span>
      <div className="lr-roster-caption"><span>Recent activity first</span><span>Questions</span></div>
      <div className="lr-session-scroll" aria-busy={loading}>
        {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { if (loading) return; setError(''); setStudents(null); setLoading(true); setRevision((value) => value + 1) }}>Retry</button></div>}
        {loading && <EmptyState loading title="Loading students…" />}
        {filtered?.length === 0 && <EmptyState title={students?.length ? 'No students found' : 'No student accounts yet'} />}
        {filtered?.map((student) => {
          const destination = { ...route, student: student.user_id, learningSession: undefined, learningPane: 'sessions' as const, offset: undefined }
          return <a data-student-id={student.user_id} className="list-item lr-student-item content-auto" key={student.user_id} aria-current={selected?.user_id === student.user_id ? 'true' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}><span className="lr-student-name"><strong>{student.display_name}</strong><small translate="no">{student.user_id}</small></span><span className="lr-student-count"><strong>{numberFormatter.format(student.question_count)}</strong><small>{formatShortDate(student.last_active_at)}</small></span></a>
        })}
      </div>
    </aside>
    {selected ? <StudentRecords key={`${selected.user_id}:${route.offset ?? 0}`} student={selected} screen={screen} /> : <div className="lr-reader"><EmptyState title="Select a student to view their Q&A records" /></div>}
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
      .catch((failure) => { if (current) { setError(friendlyError(failure, 'The summaries could not be loaded. Try again.')); setSummariesLoading(false) } })
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
    setGenerating(true); setError(''); setAnnouncement('Generating the class question summary. Please wait.')
    try {
      const { summary } = await generateClassSummary()
      if (!mounted.current || generationRequest.current !== request) return
      setSummaries((items) => [summary, ...(items || [])])
      setAnnouncement('Class question summary generated.')
      const current = getRoute()
      if (current.entryKey === origin.entryKey && current.view === 'learning' && current.learningSection === 'summaries' && current.summary === origin.summary) {
        navigate({ ...current, summary: summary.id })
      }
    } catch (failure) {
      if (!mounted.current || generationRequest.current !== request) return
      setError(friendlyError(failure, 'The summary could not be generated. Try again later.'))
      setAnnouncement('Summary generation failed.')
    } finally {
      if (mounted.current && generationRequest.current === request) setGenerating(false)
    }
  }
  return <section className="lr-summaries-view" aria-labelledby="learning-summary-title">
    <span className="visually-hidden" role="status">{announcement}</span>
    {error && <div className="lr-error" role="alert"><span>{error}</span><button type="button" className="btn btn-ghost btn-sm" disabled={summariesLoading} onClick={refresh}>Retry</button></div>}
    <div className="panel lr-workspace lr-summary-workspace" data-screen={route.summary ? 'record' : 'summaries'}>
      <aside className="lr-navigation" aria-label="Summary list">
        <header className="lr-pane-heading"><h2>Class summaries</h2><button type="button" className="btn btn-ghost btn-sm" disabled={generating || summariesLoading} onClick={refresh}>{summariesLoading && summaries ? <Icon name="loader" size={16} className="spin" /> : <Icon name="refresh" size={16} />}{summariesLoading && summaries ? 'Refreshing…' : 'Refresh'}</button></header>
        <div className="lr-summary-actions"><button type="button" className="btn btn-primary" disabled={generating || summariesLoading || !summaries} onClick={() => void generate()}>{generating && <Icon name="loader" size={16} className="spin" />}{generating ? 'Generating…' : 'Generate new summary'}</button></div>
        <div className="lr-session-scroll" aria-busy={summariesLoading}>{!summaries && summariesLoading && <EmptyState loading title="Loading summaries…" />}{summaries?.length === 0 && <EmptyState title="No summaries yet" />}{summaries?.map((summary) => {
          const destination = { ...route, summary: summary.id }
          return <a data-summary-id={summary.id} className="list-item lr-session-item content-auto" key={summary.id} aria-current={summary.id === selected?.id ? 'page' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}><strong>{formatDateTime(summary.created_at)}</strong><span className="lr-session-footer">{formatCount(summary.question_count, 'question')} · {formatCount(summary.student_count, 'student')}</span></a>
        })}</div>
        <p className="lr-summary-note">Generated from newly submitted student questions. You can refresh after leaving the page to see the result.</p>
      </aside>
      <section className="lr-reader" aria-labelledby="learning-summary-title">
        <header className="lr-reader-toolbar"><a ref={backRef} className="btn-icon lr-mobile-only" aria-label="Back to summaries" href={routeHref({ ...route, summary: undefined })} onClick={(event) => followRoute(event, { ...route, summary: undefined })}><Icon name="chevron-left" size={18} /></a><div className="lr-reader-context"><strong>Class question summary</strong>{selected && <span>{formatDateTime(selected.created_at)}</span>}</div></header>
        <div className="lr-reader-scroll" ref={readerRef} tabIndex={0} aria-label="Summary content"><h2 id="learning-summary-title" className="visually-hidden">Class question summary report</h2>{selected ? <article className="lr-report"><p className="lr-report-range">{formatCount(selected.question_count, 'question')} · {formatCount(selected.student_count, 'student')}<br />{selected.window_start ? `From ${formatDateTime(selected.window_start)}` : 'From the earliest record'} to {formatDateTime(selected.window_end)} (inclusive, server time)</p><MessageContent content={selected.content} /><p className="lr-report-note">AI-generated. Check it against the original questions.</p></article> : <EmptyState title="Select a summary to view its content" />}</div>
      </section>
    </div>
  </section>
}

export default function Learning({ navigation }: { navigation?: ReactNode }) {
  const route = useRoute()
  const section = route.learningSection ?? 'students'
  return <div className="learning-page">
    <header className="lr-toolbar">{navigation}<h1 className="visually-hidden">Data</h1><nav className="segmented" aria-label="Data">
      <a aria-current={section === 'students' ? 'page' : undefined} href={routeHref({ ...route, learningSection: undefined })} onClick={(event) => followRoute(event, { ...route, learningSection: undefined })}>Student Q&A</a>
      <a aria-current={section === 'summaries' ? 'page' : undefined} href={routeHref({ ...route, learningSection: 'summaries' })} onClick={(event) => followRoute(event, { ...route, learningSection: 'summaries' })}>Class summaries</a>
    </nav></header>
    {section === 'students' ? <Students /> : <Summaries />}
  </div>
}
