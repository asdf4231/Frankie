/**
 * 引用跳转 —— 课件 / Wiki 页选中文字后，把引用带入新对话。
 *
 * 数据通过 sessionStorage 在「文件库 → 聊天」之间传递，避免长文本
 * 挤进 URL，也天然适配 Chat 组件在导航后才挂载的时序。
 */

export interface PendingQuote {
  /** 用户选中的原文。 */
  text: string
  /** 显示名称（课件标题 / Wiki 标题），用于归属标注。 */
  source: string
  /** 源文件绝对路径（abs_path），便于将来溯源。 */
  sourcePath: string
}

const STORAGE_KEY = 'frankie-pending-quote'

export function setPendingQuote(quote: PendingQuote): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(quote))
  } catch {
    /* 隐私模式等写入失败时静默忽略 */
  }
}

/** 取走待处理的引用；只返回一次，读取后即清除。 */
export function takePendingQuote(): PendingQuote | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    const parsed = JSON.parse(raw) as Partial<PendingQuote>
    if (typeof parsed.text === 'string' && parsed.text.trim()) {
      return {
        text: parsed.text,
        source: typeof parsed.source === 'string' ? parsed.source : '',
        sourcePath: typeof parsed.sourcePath === 'string' ? parsed.sourcePath : '',
      }
    }
  } catch {
    /* 忽略损坏的引用数据 */
  }
  return null
}

/** 输入框预填内容：引用块 + 来源，光标停在末尾等用户补充问题。 */
export function quoteInputPrefill(quote: PendingQuote): string {
  const block = quote.text
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
  const source = quote.source ? `（引用自《${quote.source}》）` : '（引用自课程资料）'
  return `${block}\n\n${source}\n`
}
