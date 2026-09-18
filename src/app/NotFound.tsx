import { Link } from 'react-router'

export function NotFound() {
  return (
    <article className="tool-page">
      <header className="tool-head">
        <h1>Not found</h1>
        <p>No tool lives at this address.</p>
      </header>
      <Link className="primary-btn link-btn" to="/">
        Back to all tools
      </Link>
    </article>
  )
}
