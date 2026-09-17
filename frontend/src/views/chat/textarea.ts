const MAX_TEXTAREA_HEIGHT = 200
export const NATIVE_SIZING = CSS.supports('field-sizing', 'content')

/** Grow a draft textarea to its content (up to the shared cap) unless the browser sizes it natively. */
export function resizeTextarea(el: HTMLTextAreaElement) {
  if (NATIVE_SIZING || !el.clientWidth) return
  el.style.height = '0px'
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
}
