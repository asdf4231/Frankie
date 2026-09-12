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

export function groupLabel(value: string, now = new Date()): string {
  const date = parseLocal(value)
  if (!date) return '更早'
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return '最近 7 天'
  if (days < 30) return '最近 30 天'
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
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
