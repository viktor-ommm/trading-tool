import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router'
import { tools } from '../tools/registry'
import { Icon } from '../ui/icons'

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand" end>
          <Icon name="grid" />
          <span>Trading Toolkit</span>
        </NavLink>

        <nav className="nav">
          {tools.map(tool => (
            <NavLink key={tool.id} to={`/tools/${tool.id}`} className="nav-item" title={tool.summary}>
              <Icon name={tool.icon} />
              <span className="nav-title">{tool.title}</span>
              {tool.status === 'planned' && <span className="badge">soon</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
