const pad = (n: number) => String(n).padStart(2, '0')

/** Local wall-clock time in the server's format (`YYYY-MM-DDTHH:mm:ss`, no zone). */
export function localIso(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** Parse the server's zone-less timestamps as local time; `Date` parsing of fractional seconds varies by engine. */
export function parseLocal(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' })
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit' })
const documentDateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
export const numberFormatter = new Intl.NumberFormat('en-US')

/** Format an integer count with a regular English noun. */
export function formatCount(count: number, noun: string): string {
  return `${numberFormatter.format(count)} ${noun}${count === 1 ? '' : 's'}`
}

export function formatDateTime(value: string | null): string {
  if (!value) return 'No record'
  const date = parseLocal(value)
  return date ? dateTimeFormatter.format(date) : 'Unknown date'
}

export function formatShortDate(value: string | null): string {
  if (!value) return '—'
  const date = parseLocal(value)
  return date ? shortDateFormatter.format(date) : '—'
}

export function formatDocumentDate(value: string): string {
  const date = parseLocal(value)
  return date ? documentDateFormatter.format(date) : value
}

export function groupLabel(value: string, now = new Date()): string {
  const date = parseLocal(value)
  if (!date) return 'Earlier'
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Last 7 days'
  if (days < 30) return 'Last 30 days'
  return monthFormatter.format(date)
}

/** Group items already sorted by `updated_at` descending, keeping their order. */
export function groupByDate<T extends { updated_at: string }>(items: T[]): { label: string; items: T[] }[] {
  const now = new Date()
  const groups: { label: string; items: T[] }[] = []
  for (const item of items) {
    const label = groupLabel(item.updated_at, now)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}
