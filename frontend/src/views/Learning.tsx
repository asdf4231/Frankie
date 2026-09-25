import { useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import Icon from '../components/Icon'
import MessageContent from '../components/MessageContent'
import {
  deleteClassSummary, errorMessage, generateClassSummary, getClassSummaries, getStudentAttachmentUrl,
  getStudentSession, getStudentSessions, getStudents,
  type AnalyticsPreset, type ClassSummary, type ClassSummaryRequest,
  type LearningSession, type SessionSummary, type StudentOverview,
} from '../api/client'
import { formatCount, formatDate, formatDateRange, formatDateTime, formatShortDate, numberFormatter } from '../lib/dates'
import { followRoute, getRoute, navigate, routeHref, useRoute, type Route } from '../lib/router'
import './Learning.css'

const PAGE_SIZE = 50
const statusLabels = { completed: 'Completed', failed: 'Failed', cancelled: 'Stopped', running: 'Answering' }
const statusBadges = { completed: 'badge-success', failed: 'badge-danger', cancelled: 'badge-warning', running: 'badge-accent' }
const friendlyError = (error: unknown, fallback: string) => errorMessage(error, fallback)
const initial = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? '?'

function Avatar({ name }: { name: string }) {
  return <span className="avatar lr-avatar" aria-hidden="true">{initial(name)}</span>
}

function EmptyState({ title, loading = false, children }: { title: string; loading?: boolean; children?: ReactNode }) {
  return <div className="lr-empty" role={loading ? 'status' : undefined}>
    {loading ? <><Icon name="loader" className="spin" /><span className="visually-hidden">{title}</span></> : <><p>{title}</p>{children}</>}
  </div>
}

function ErrorNotice({ message, busy, onRetry }: { message: string; busy?: boolean; onRetry?: () => void }) {
  return <div className="lr-error" role="alert">
    <Icon name="alert-circle" size={16} />
    <span>{message}</span>
    {onRetry && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onRetry}>Retry</button>}
  </div>
}

function BackLink({ route, label, backRef }: { route: Route; label: string; backRef?: RefObject<HTMLAnchorElement | null> }) {
  return <a ref={backRef} className="btn-icon lr-mobile-only" aria-label={label} href={routeHref(route)} onClick={(event) => followRoute(event, route)}><Icon name="chevron-left" size={18} /></a>
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
  const setAnswers = (visible: boolean) => navigate({ ...route, showAnswers: visible ? undefined : false }, { replace: true })
  return <section className="lr-reader" aria-labelledby="learning-record-title">
    <header className="lr-reader-toolbar">
      <BackLink backRef={backRef} route={{ ...route, learningPane: 'sessions' }} label="Back to conversations" />
      <div className="breadcrumb lr-breadcrumb" aria-label="Current location">
        <span>{student.display_name}</span>
        <Icon name="chevron-right" size={14} />
        <span title={session?.topic || undefined}>{session?.topic || 'Conversation'}</span>
      </div>
      <div className="segmented lr-answers-toggle" role="group" aria-label="Answer visibility">
        <button type="button" aria-pressed={showAnswers} onClick={() => setAnswers(true)}>Q&amp;A</button>
        <button type="button" aria-pressed={!showAnswers} onClick={() => setAnswers(false)}>Questions only</button>
      </div>
    </header>
    <div className="lr-reader-scroll" tabIndex={0} aria-label="Q&A content" aria-busy={loading}>
      <h2 id="learning-record-title" className="visually-hidden">Q&amp;A record</h2>
      {error && <div className="lr-document"><ErrorNotice message={error} busy={loading} onRetry={() => { if (loading) return; setError(''); setSession(null); setLoading(true); setRevision((value) => value + 1) }} /></div>}
      {loading && <EmptyState loading title="Loading Q&A record…" />}
      {session && <div className="lr-document">
        {!session.turns.length && <EmptyState title="This conversation has no questions yet" />}
        {session.turns.map((turn, index) => <article className="lr-turn content-auto" key={turn.turn_id} aria-label={`Question ${numberFormatter.format(index + 1)}`}>
          <div className="lr-turn-meta">
            <span className="lr-turn-number">{numberFormatter.format(index + 1)}</span>
            <time dateTime={turn.started_at}>{formatDateTime(turn.started_at)}</time>
            {turn.status !== 'completed' && <span className={`badge ${statusBadges[turn.status]}`}>{statusLabels[turn.status]}</span>}
          </div>
          <div className="lr-question"><MessageContent content={turn.user_text} /></div>
          {!!turn.attachments.length && <ul className="lr-attachments">{turn.attachments.map((file) => <li key={file.id}><a href={getStudentAttachmentUrl(student.user_id, file.id)} target="_blank" rel="noreferrer"><Icon name="paperclip" size={14} />{file.name}</a></li>)}</ul>}
          {showAnswers && <section className="lr-answer" aria-labelledby={`answer-${turn.turn_id}`}>
            <h3 id={`answer-${turn.turn_id}`}>Assistant answer</h3>
            {turn.assistant_text ? <MessageContent content={turn.assistant_text} /> : <p className="lr-muted">No saved answer.</p>}
            {turn.error && <p className="lr-answer-error">The answer did not finish.</p>}
          </section>}
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
  const pageRoute = (next: number) => ({ ...route, offset: next || undefined, learningSession: undefined, learningPane: 'sessions' as const })
  const hasPrevious = offset > 0
  const hasNext = sessions?.length === PAGE_SIZE
  return <>
    <aside className="lr-pane lr-sessions" aria-label={`${student.display_name}'s conversations`}>
      <header className="lr-pane-heading lr-student-heading">
        <BackLink backRef={backRef} route={studentsRoute} label="Back to students" />
        <Avatar name={student.display_name} />
        <div className="lr-student-heading-text">
          <h2>{student.display_name}</h2>
          <p>{formatCount(student.session_count, 'conversation')} · {formatCount(student.question_count, 'question')}</p>
        </div>
      </header>
      <div className="lr-scroll" aria-busy={loading}>
        {error && <ErrorNotice message={error} busy={loading} onRetry={() => { if (loading) return; setError(''); setSessions(null); setLoading(true); setRevision((value) => value + 1) }} />}
        {loading && <EmptyState loading title="Loading conversations…" />}
        {sessions?.length === 0 && <EmptyState title="No conversations yet" />}
        {sessions?.map((session) => {
          const destination = { ...route, student: student.user_id, learningSession: session.session_id, learningPane: 'record' as const }
          return <a data-learning-session={session.session_id} className="list-item lr-session-item content-auto" key={session.session_id} aria-current={selected === session.session_id ? 'page' : undefined} href={routeHref(destination)} title={session.topic || 'New chat'} onClick={(event) => followRoute(event, destination)}>
            <span className="lr-item-title">{session.topic || 'New chat'}</span>
            <span className="lr-item-meta"><time dateTime={session.updated_at}>{formatDateTime(session.updated_at)}</time> · {formatCount(Math.ceil(session.message_count / 2), 'question')}</span>
          </a>
        })}
      </div>
      {(hasPrevious || hasNext) && <div className="lr-pagination">
        <a className={`btn-icon${hasPrevious ? '' : ' is-disabled'}`} aria-label="Previous page" aria-disabled={!hasPrevious} href={routeHref(pageRoute(Math.max(0, offset - PAGE_SIZE)))} onClick={(event) => { if (!hasPrevious) { event.preventDefault(); return } followRoute(event, pageRoute(Math.max(0, offset - PAGE_SIZE))) }}><Icon name="chevron-left" size={18} /></a>
        <span>Page {numberFormatter.format(offset / PAGE_SIZE + 1)}</span>
        <a className={`btn-icon${hasNext ? '' : ' is-disabled'}`} aria-label="Next page" aria-disabled={!hasNext} href={routeHref(pageRoute(offset + PAGE_SIZE))} onClick={(event) => { if (!hasNext) { event.preventDefault(); return } followRoute(event, pageRoute(offset + PAGE_SIZE)) }}><Icon name="chevron-right" size={18} /></a>
      </div>}
    </aside>
    {selected ? <SessionRecord key={selected} student={student} sessionId={selected} active={screen === 'record'} /> : <div className="lr-reader"><EmptyState title={sessions?.length === 0 ? 'No Q&A records' : 'Select a conversation to read its Q&A'} /></div>}
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
  return <div className="lr-workspace lr-students-workspace" data-screen={screen}>
    <aside className="lr-pane lr-roster" aria-label="Students">
      <header className="lr-pane-heading">
        <h2>Students</h2>
        {filtered && <span className="lr-pane-count">{numberFormatter.format(filtered.length)}</span>}
      </header>
      <label className="search focus-field lr-search">
        <Icon name="search" size={16} />
        <input name="student-search" autoComplete="off" aria-label="Search students" placeholder="Search by name or ID" value={search} onChange={(event) => navigate({ ...route, studentSearch: event.target.value || undefined }, { replace: true })} />
        {search && <button type="button" className="btn-icon btn-icon-sm" aria-label="Clear search" onClick={() => navigate({ ...route, studentSearch: undefined }, { replace: true })}><Icon name="x" size={14} /></button>}
      </label>
      <span className="visually-hidden" role="status">{query ? `${formatCount(filtered?.length ?? 0, 'student')} found` : ''}</span>
      <div className="lr-scroll" aria-busy={loading}>
        {error && <ErrorNotice message={error} busy={loading} onRetry={() => { if (loading) return; setError(''); setStudents(null); setLoading(true); setRevision((value) => value + 1) }} />}
        {loading && <EmptyState loading title="Loading students…" />}
        {filtered?.length === 0 && <EmptyState title={students?.length ? 'No matching students' : 'No student accounts yet'} />}
        {filtered?.map((student) => {
          const destination = { ...route, student: student.user_id, learningSession: undefined, learningPane: 'sessions' as const, offset: undefined }
          return <a data-student-id={student.user_id} className="list-item lr-student-item content-auto" key={student.user_id} aria-current={selected?.user_id === student.user_id ? 'true' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}>
            <Avatar name={student.display_name} />
            <span className="lr-student-text">
              <span className="lr-student-row"><span className="lr-student-name">{student.display_name}</span><time className="lr-student-date" dateTime={student.last_active_at ?? undefined}>{formatShortDate(student.last_active_at)}</time></span>
              <span className="lr-item-meta">{formatCount(student.question_count, 'question')}</span>
            </span>
          </a>
        })}
      </div>
    </aside>
    {selected ? <StudentRecords key={`${selected.user_id}:${route.offset ?? 0}`} student={selected} screen={screen} /> : <div className="lr-reader"><EmptyState title={loading ? '' : 'Select a student to read their Q&A'} /></div>}
  </div>
}

const presetLabels: Record<AnalyticsPreset, string> = {
  last7: 'Last 7 days', semester: 'Since semester start', since_last: 'Since last report', custom: 'Custom range',
}

const windowTitle = (summary: Pick<ClassSummary, 'window_start' | 'window_end'>) =>
  summary.window_start ? formatDateRange(summary.window_start, summary.window_end) : `Through ${formatDate(summary.window_end)}`

function ReportScope({ summary }: { summary: ClassSummary }) {
  const total = summary.scope_student_count
  if (total === undefined) return summary.students ? <>{formatCount(summary.students.length, 'student')} selected</> : <>All students</>
  return <>{numberFormatter.format(summary.students?.length ?? total)}/{numberFormatter.format(total)}</>
}

function DeleteReport({ busy, disabled, onConfirm }: { busy: boolean; disabled: boolean; onConfirm: () => void }) {
  // Same two-step arm as conversation deletion: the first click only arms the
  // button, and it disarms itself so a stale click cannot delete a report.
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (armed) { const timer = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(timer) } }, [armed])
  const select = () => {
    if (!armed) { setArmed(true); return }
    setArmed(false)
    onConfirm()
  }
  return <button type="button" className={`btn btn-sm${armed ? ' btn-danger' : ''}`} disabled={disabled} onClick={select}>
    {busy ? <Icon name="loader" size={14} className="spin" /> : <Icon name="trash" size={14} />}{busy ? 'Deleting…' : armed ? 'Confirm delete' : 'Delete'}
  </button>
}

function presetHint(preset: AnalyticsPreset, newest: ClassSummary | undefined): string {
  switch (preset) {
    case 'last7': return 'Questions asked in the last 7 days, up to now.'
    case 'semester': return 'Every saved student question, from the earliest record up to now.'
    case 'since_last': return newest ? `Questions asked after the newest report ended, ${formatDateTime(newest.window_end)}.` : 'There is no earlier report yet, so this covers every saved question.'
    case 'custom': return 'Whole days in server time; the end date is capped at now.'
  }
}

interface ComposerProps {
  roster: StudentOverview[] | null
  rosterFailed: boolean
  onRosterRetry: () => void
  newest: ClassSummary | undefined
  generating: boolean
  error: string
  onGenerate: (request: ClassSummaryRequest) => void
  backRoute: Route
  backRef: RefObject<HTMLAnchorElement | null>
}

function ReportComposer({ roster, rosterFailed, onRosterRetry, newest, generating, error, onGenerate, backRoute, backRef }: ComposerProps) {
  const ids = useId()
  const [preset, setPreset] = useState<AnalyticsPreset>('last7')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [students, setStudents] = useState<ReadonlySet<string>>(new Set())
  const [instructions, setInstructions] = useState('')
  const toggleStudent = (userId: string) => setStudents((current) => {
    const next = new Set(current)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    return next
  })
  const rangeIncomplete = preset === 'custom' && (!dateFrom || !dateTo)
  const rangeInvalid = preset === 'custom' && !!dateFrom && !!dateTo && dateFrom > dateTo
  const scopeIncomplete = scope === 'selected' && students.size === 0
  const blocked = generating || rangeIncomplete || rangeInvalid || scopeIncomplete
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (blocked) return
    onGenerate({
      preset,
      ...(preset === 'custom' ? { date_from: dateFrom, date_to: dateTo } : {}),
      students: scope === 'all' ? null : [...students],
      instructions: instructions.trim() || null,
    })
  }
  return <section className="lr-reader" aria-labelledby={`${ids}-title`}>
    <header className="lr-reader-toolbar">
      <BackLink backRef={backRef} route={backRoute} label="Back to reports" />
      <div className="breadcrumb lr-breadcrumb" aria-label="Current location"><span>Reports</span><Icon name="chevron-right" size={14} /><span>New report</span></div>
    </header>
    <div className="lr-reader-scroll" tabIndex={0} aria-label="Report form">
      <form className="lr-compose" onSubmit={submit}>
        <header className="lr-compose-header">
          <h2 id={`${ids}-title`}>New report</h2>
          <p>Choose which questions to analyze. Only what students asked is sent to the model; answers, attachments and admin chats stay out.</p>
        </header>
        <fieldset className="lr-compose-fields" disabled={generating}>
          <div className="lr-field" role="group" aria-labelledby={`${ids}-range`}>
            <span className="lr-field-label" id={`${ids}-range`}>Time range</span>
            <div className="lr-choices">
              {(Object.keys(presetLabels) as AnalyticsPreset[]).map((value) => <label className="lr-choice" key={value}>
                <input type="radio" name={`${ids}-preset`} value={value} checked={preset === value} onChange={() => setPreset(value)} />
                <span>{presetLabels[value]}</span>
              </label>)}
            </div>
            {preset === 'custom' && <div className="lr-dates">
              <label className="lr-date"><span>From</span><input type="date" className="input" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <label className="lr-date"><span>To</span><input type="date" className="input" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
            </div>}
            {rangeInvalid ? <p className="lr-field-error" role="alert">The end date is before the start date.</p> : <p className="lr-field-hint">{presetHint(preset, newest)}</p>}
          </div>
          <div className="lr-field" role="group" aria-labelledby={`${ids}-scope`}>
            <span className="lr-field-label" id={`${ids}-scope`}>Students</span>
            <div className="lr-choices">
              <label className="lr-choice"><input type="radio" name={`${ids}-scope`} checked={scope === 'all'} onChange={() => setScope('all')} /><span>All students</span></label>
              <label className="lr-choice"><input type="radio" name={`${ids}-scope`} checked={scope === 'selected'} onChange={() => setScope('selected')} /><span>Selected students</span></label>
            </div>
            {scope === 'selected' && (rosterFailed
              ? <ErrorNotice message="The student list could not be loaded." onRetry={onRosterRetry} />
              : <div className="lr-picker">
                <div className="lr-picker-bar">
                  <span>{roster ? `${numberFormatter.format(students.size)} of ${formatCount(roster.length, 'student')} selected` : 'Loading students…'}</span>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!roster?.length || students.size === roster.length} onClick={() => setStudents(new Set(roster?.map((student) => student.user_id)))}>Select all</button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!students.size} onClick={() => setStudents(new Set())}>Clear</button>
                </div>
                {roster?.length === 0
                  ? <p className="lr-field-hint">No student accounts yet.</p>
                  : <div className="lr-picker-list">{roster?.map((student) => <label className="lr-choice lr-choice-sm" key={student.user_id}>
                    <input type="checkbox" checked={students.has(student.user_id)} onChange={() => toggleStudent(student.user_id)} />
                    <span>{student.display_name}</span>
                  </label>)}</div>}
                {scopeIncomplete && roster && roster.length > 0 && <p className="lr-field-hint">Select at least one student.</p>}
              </div>)}
          </div>
          <div className="lr-field">
            <label className="lr-field-label" htmlFor={`${ids}-instructions`}>Additional instructions <span className="lr-field-optional">Optional</span></label>
            <textarea id={`${ids}-instructions`} className="lr-textarea" rows={3} maxLength={2000} placeholder="e.g. Focus on difficulties with Bellman equations" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
            <p className="lr-field-hint">Appended to the standard analysis prompt as extra priorities for this report.</p>
          </div>
        </fieldset>
        <div className="lr-compose-actions">
          <button type="submit" className="btn btn-primary" disabled={blocked}>{generating ? <Icon name="loader" size={16} className="spin" /> : <Icon name="bar-chart" size={16} />}{generating ? 'Generating…' : 'Generate report'}</button>
          <p className="lr-field-hint">{generating ? 'Usually takes a minute or two. The report is saved on the server even if you leave this page.' : 'Uses the configured DeepSeek model; the saved report appears in the list on the left.'}</p>
        </div>
        {error && <ErrorNotice message={error} />}
      </form>
    </div>
  </section>
}

function Summaries() {
  const route = useRoute()
  const [summaries, setSummaries] = useState<ClassSummary[] | null>(null)
  const [summariesLoading, setSummariesLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [roster, setRoster] = useState<StudentOverview[] | null>(null)
  const [rosterFailed, setRosterFailed] = useState(false)
  const [rosterRevision, setRosterRevision] = useState(0)
  const [generationError, setGenerationError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const backRef = useRef<HTMLAnchorElement>(null)
  const readerRef = useRef<HTMLDivElement>(null)
  const composing = !!route.compose
  const previousScreen = useRef({ summary: route.summary, composing })
  const mounted = useRef(true)
  const generationRequest = useRef(0)
  useLayoutEffect(() => { readerRef.current?.scrollTo(0, 0) }, [route.summary, composing])
  useLayoutEffect(() => {
    const previous = previousScreen.current
    if ((route.summary || composing) && backRef.current?.getClientRects().length) backRef.current.focus({ preventScroll: true })
    else if (!route.summary && !composing && previous.summary) document.querySelector<HTMLAnchorElement>(`[data-summary-id="${CSS.escape(previous.summary)}"]`)?.focus({ preventScroll: true })
    else if (!route.summary && !composing && previous.composing) document.querySelector<HTMLAnchorElement>('[data-new-report]')?.focus({ preventScroll: true })
    previousScreen.current = { summary: route.summary, composing }
  }, [route.summary, composing])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; generationRequest.current += 1 }
  }, [])
  useEffect(() => {
    let current = true
    getClassSummaries().then((data) => { if (current) { setSummaries(data.summaries); setError(''); setSummariesLoading(false) } })
      .catch((failure) => { if (current) { setError(friendlyError(failure, 'The reports could not be loaded. Try again.')); setSummariesLoading(false) } })
    return () => { current = false }
  }, [revision])
  useEffect(() => {
    let current = true
    getStudents().then((data) => { if (current) { setRoster(data.students); setRosterFailed(false) } })
      .catch(() => { if (current) setRosterFailed(true) })
    return () => { current = false }
  }, [rosterRevision])
  const selected = composing ? undefined : summaries?.find((summary) => summary.id === route.summary) || summaries?.[0]
  const showComposer = composing || (summaries !== null && summaries.length === 0)
  const composeRoute = { ...route, summary: undefined, compose: true }
  const listRoute = { ...route, summary: undefined, compose: undefined }
  const refresh = () => {
    if (summariesLoading) return
    setError('')
    setSummariesLoading(true)
    setRevision((value) => value + 1)
  }
  const generate = async (request: ClassSummaryRequest) => {
    if (generating) return
    const origin = getRoute()
    const attempt = ++generationRequest.current
    setGenerating(true); setGenerationError(''); setAnnouncement('Generating the learning analytics report. Please wait.')
    try {
      const { summary } = await generateClassSummary(request)
      if (!mounted.current || generationRequest.current !== attempt) return
      setSummaries((items) => [summary, ...(items || [])])
      setAnnouncement('Learning analytics report generated.')
      const current = getRoute()
      if (current.entryKey === origin.entryKey && current.view === 'learning' && current.learningSection === undefined && current.summary === origin.summary && current.compose === origin.compose) {
        navigate({ ...current, summary: summary.id, compose: undefined })
      }
    } catch (failure) {
      if (!mounted.current || generationRequest.current !== attempt) return
      setGenerationError(friendlyError(failure, 'The report could not be generated. Try again later.'))
      setAnnouncement('Report generation failed.')
    } finally {
      if (mounted.current && generationRequest.current === attempt) setGenerating(false)
    }
  }
  const remove = async (summary: ClassSummary) => {
    if (deletingId) return
    setDeletingId(summary.id)
    setError('')
    try {
      await deleteClassSummary(summary.id)
      if (!mounted.current) return
      setSummaries((items) => (items || []).filter((item) => item.id !== summary.id))
      setAnnouncement('Learning analytics report deleted.')
      const current = getRoute()
      if (current.summary === summary.id) navigate({ ...current, summary: undefined }, { replace: true })
    } catch (failure) {
      if (mounted.current) setError(friendlyError(failure, 'The report could not be deleted. Try again.'))
    } finally {
      if (mounted.current) setDeletingId(null)
    }
  }
  return <section className="lr-summaries-view" aria-label="Learning analytics">
    <span className="visually-hidden" role="status">{announcement}</span>
    <div className="lr-workspace lr-summary-workspace" data-screen={composing || route.summary ? 'record' : 'summaries'}>
      <aside className="lr-pane lr-reports" aria-label="Analytics reports">
        <header className="lr-pane-heading">
          <h2>Reports</h2>
          {summaries && <span className="lr-pane-count">{numberFormatter.format(summaries.length)}</span>}
          <a data-new-report className="btn btn-sm" aria-current={composing ? 'page' : undefined} href={routeHref(composeRoute)} onClick={(event) => followRoute(event, composeRoute)}><Icon name="plus" size={16} />New report</a>
        </header>
        {generating && <div className="lr-pane-status" role="status"><Icon name="loader" size={14} className="spin" />Generating a report…</div>}
        <div className="lr-scroll" aria-busy={summariesLoading}>
          {error && <ErrorNotice message={error} busy={summariesLoading} onRetry={refresh} />}
          {!summaries && summariesLoading && <EmptyState loading title="Loading reports…" />}
          {summaries?.length === 0 && <EmptyState title="No reports yet" />}
          {summaries?.map((summary) => {
            const destination = { ...route, summary: summary.id, compose: undefined }
            return <a data-summary-id={summary.id} className="list-item lr-report-item content-auto" key={summary.id} aria-current={summary.id === selected?.id ? 'page' : undefined} href={routeHref(destination)} onClick={(event) => followRoute(event, destination)}>
              <span className="lr-student-row"><span className="lr-item-title">{windowTitle(summary)}</span><time className="lr-student-date" dateTime={summary.created_at}>{formatShortDate(summary.created_at)}</time></span>
              <span className="lr-item-meta">{formatCount(summary.question_count, 'question')} · {summary.students?.length ? formatCount(summary.students.length, 'student') : 'All students'}</span>
            </a>
          })}
        </div>
      </aside>
      {showComposer
        ? <ReportComposer roster={roster} rosterFailed={rosterFailed} onRosterRetry={() => setRosterRevision((value) => value + 1)} newest={summaries?.[0]} generating={generating} error={generationError} onGenerate={(request) => void generate(request)} backRoute={listRoute} backRef={backRef} />
        : <section className="lr-reader" aria-labelledby="learning-summary-title">
          <header className="lr-reader-toolbar">
            <BackLink backRef={backRef} route={listRoute} label="Back to reports" />
            <div className="breadcrumb lr-breadcrumb" aria-label="Current location"><span>Reports</span>{selected && <><Icon name="chevron-right" size={14} /><span>{windowTitle(selected)}</span></>}</div>
            {selected && <DeleteReport key={selected.id} busy={deletingId === selected.id} disabled={deletingId !== null} onConfirm={() => void remove(selected)} />}
          </header>
          <div className="lr-reader-scroll" ref={readerRef} tabIndex={0} aria-label="Report content">
            {selected ? <article className="lr-report">
              <header className="lr-report-header">
                <h2 id="learning-summary-title">{windowTitle(selected)}</h2>
                <p className="lr-report-subtitle">{presetLabels[selected.preset]} · Generated {formatDateTime(selected.created_at)}</p>
              </header>
              <dl className="lr-stats">
                <div className="lr-stat"><dt>Questions</dt><dd>{numberFormatter.format(selected.question_count)}</dd></div>
                <div className="lr-stat"><dt>Students</dt><dd>{numberFormatter.format(selected.student_count)}</dd></div>
                <div className="lr-stat lr-stat-wide"><dt>Scope</dt><dd><ReportScope summary={selected} /></dd></div>
              </dl>
              <p className="lr-report-window">Questions asked {selected.window_start ? `after ${formatDateTime(selected.window_start)} and ` : ''}up to {formatDateTime(selected.window_end)}, server time.</p>
              {selected.instructions && <div className="lr-report-instructions"><h3 id="learning-summary-instructions">Additional instructions</h3><p>{selected.instructions}</p></div>}
              <MessageContent content={selected.content} />
              <p className="lr-report-note">AI-generated from student questions only. Check it against the original conversations before acting on it.</p>
            </article> : <><h2 id="learning-summary-title" className="visually-hidden">Learning analytics report</h2>{summariesLoading ? <EmptyState loading title="Loading reports…" /> : <EmptyState title="Select a report to read it" />}</>}
          </div>
        </section>}
    </div>
  </section>
}

export default function Learning({ navigation }: { navigation?: ReactNode }) {
  const route = useRoute()
  const section = route.learningSection ?? 'summaries'
  return <div className="learning-page">
    <header className="lr-toolbar">{navigation}<h1 className="visually-hidden">Analytics</h1><nav className="segmented" aria-label="Analytics">
      <a aria-current={section === 'students' ? 'page' : undefined} href={routeHref({ ...route, learningSection: 'students' })} onClick={(event) => followRoute(event, { ...route, learningSection: 'students' })}>Student Q&amp;A</a>
      <a aria-current={section === 'summaries' ? 'page' : undefined} href={routeHref({ ...route, learningSection: undefined })} onClick={(event) => followRoute(event, { ...route, learningSection: undefined })}>Learning Analytics</a>
    </nav></header>
    {section === 'students' ? <Students /> : <Summaries />}
  </div>
}
