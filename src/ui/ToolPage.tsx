import type { ReactNode } from 'react'

/** Standard heading block every tool renders above its own form. */
export function ToolPage({
  title,
  summary,
  wide = false,
  children,
}: {
  title: string
  summary: string
  /** Roomier column, for tools built around a table rather than a short form. */
  wide?: boolean
  children: ReactNode
}) {
  return (
    <article className={wide ? 'tool-page wide' : 'tool-page'}>
      <header className="tool-head">
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>
      {children}
    </article>
  )
}
