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

const monthFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' })
const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})
const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })
const documentDateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
export const numberFormatter = new Intl.NumberFormat('zh-CN')

export function formatDateTime(value: string | null): string {
  if (!value) return '暂无记录'
  const date = parseLocal(value)
  return date ? dateTimeFormatter.format(date) : '日期未知'
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
  if (!date) return '更早'
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return '最近 7 天'
  if (days < 30) return '最近 30 天'
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
