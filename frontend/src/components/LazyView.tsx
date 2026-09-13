import { Component, Suspense, type ReactNode } from 'react'
import Icon from './Icon'

/** Loading or failed secondary views never replace the shell or the mounted chat. */
export default class LazyView extends Component<{ children: ReactNode; navigation?: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    const fallback = (
      <div className="view-host lazy-view">
        {this.props.navigation && <header className="shell-header">{this.props.navigation}</header>}
        {this.state.failed ? (
          <p className="app-state" role="alert">This page could not be loaded. Refresh to try again.</p>
        ) : (
          <div className="app-state" role="status">
            <Icon name="loader" className="spin" />
            <span className="visually-hidden">Loading page…</span>
          </div>
        )}
      </div>
    )
    if (this.state.failed) return fallback
    return <Suspense fallback={fallback}>{this.props.children}</Suspense>
  }
}
