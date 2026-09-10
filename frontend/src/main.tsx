import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── 光标追踪光效：为可交互面板注入局部 --sx / --sy 坐标 ──────────────
// 由 CSS 中的 [data-spotlight] / .is-spotlit 规则消费，实现随鼠标移动的光晕。
const SPOTLIGHT_SELECTOR = '.status-card, .settings-card, .empty-chip, .chat-input-row, .login-card'
let _lastSpot: HTMLElement | null = null

function initSpotlight() {
  document.addEventListener(
    'pointermove',
    (event) => {
      const el = (event.target as Element | null)?.closest?.(SPOTLIGHT_SELECTOR) as HTMLElement | null
      if (el !== _lastSpot) {
        if (_lastSpot) {
          _lastSpot.style.removeProperty('--sx')
          _lastSpot.style.removeProperty('--sy')
          _lastSpot.classList.remove('is-spotlit')
        }
        _lastSpot = el
      }
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--sx', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`)
      el.style.setProperty('--sy', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
      el.classList.add('is-spotlit')
    },
    { passive: true },
  )
}

initSpotlight()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
