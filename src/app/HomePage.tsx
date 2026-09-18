import { Link } from 'react-router'
import { tools } from '../tools/registry'
import { Icon } from '../ui/icons'

export function HomePage() {
  return (
    <article className="tool-page">
      <header className="tool-head">
        <h1>Trading Toolkit</h1>
        <p>Small, focused calculators for sizing and managing trades. Everything runs in your browser.</p>
      </header>

      <div className="tool-grid">
        {tools.map(tool => (
          <Link key={tool.id} to={`/tools/${tool.id}`} className="tool-card">
            <span className="tool-card-head">
              <Icon name={tool.icon} size={22} />
              <span className="tool-card-title">{tool.title}</span>
              {tool.status === 'planned' && <span className="badge">soon</span>}
            </span>
            <span className="tool-card-summary">{tool.summary}</span>
          </Link>
        ))}
      </div>
    </article>
  )
}
