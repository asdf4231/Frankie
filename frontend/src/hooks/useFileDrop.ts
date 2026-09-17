import { useEffect, useState, type RefObject } from 'react'

/** Browsers repeat dragover every few hundred ms while a drag hovers; longer silence means it was cancelled. */
const DRAG_IDLE_MS = 1500

const carriesFiles = (event: DragEvent) => !!event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')

/**
 * True while files from outside the page are dragged over `ref`; `onDrop` receives them.
 * Text drags are ignored, and file drops elsewhere on the page are cancelled so they never navigate away.
 *
 * The caller styles descendants with `pointer-events: none` while active, so after the first dragenter
 * the element itself is the only drag target and enter/leave events cannot drift out of balance.
 */
export function useFileDrop(ref: RefObject<HTMLElement | null>, onDrop: (files: File[]) => void): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let entered: EventTarget[] = []
    let lastOver = 0
    let watchdog = 0
    const deactivate = () => {
      entered = []
      window.clearInterval(watchdog)
      watchdog = 0
      setActive(false)
    }
    const activate = () => {
      lastOver = performance.now()
      setActive(true)
      // A drag cancelled with Escape or dropped outside the window sends no dragleave; notice the silence.
      if (!watchdog) watchdog = window.setInterval(() => { if (performance.now() - lastOver > DRAG_IDLE_MS) deactivate() }, 250)
    }
    const handleEnter = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      if (!entered.includes(event.target!)) entered.push(event.target!)
      activate()
    }
    const handleOver = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'copy'
      activate()
    }
    const handleLeave = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      entered = entered.filter((target) => target !== event.target && element.contains(target as Node))
      if (entered.length === 0) deactivate()
    }
    const handleDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      deactivate()
      const files = Array.from(event.dataTransfer!.files)
      if (files.length > 0) onDrop(files)
    }
    // Outside the drop zone a file drag shows the "not allowed" cursor and a drop is swallowed.
    const guardWindow = (event: DragEvent) => {
      if (!carriesFiles(event) || element.contains(event.target as Node)) return
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'none'
    }
    element.addEventListener('dragenter', handleEnter)
    element.addEventListener('dragover', handleOver)
    element.addEventListener('dragleave', handleLeave)
    element.addEventListener('drop', handleDrop)
    window.addEventListener('dragover', guardWindow)
    window.addEventListener('drop', guardWindow)
    return () => {
      window.clearInterval(watchdog)
      element.removeEventListener('dragenter', handleEnter)
      element.removeEventListener('dragover', handleOver)
      element.removeEventListener('dragleave', handleLeave)
      element.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragover', guardWindow)
      window.removeEventListener('drop', guardWindow)
    }
  }, [ref, onDrop])

  return active
}
