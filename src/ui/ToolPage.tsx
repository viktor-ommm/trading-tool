import type { ReactNode } from 'react'

/** Standard heading block every tool renders above its own form. */
export function ToolPage({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: ReactNode
}) {
  return (
    <article className="tool-page">
      <header className="tool-head">
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>
      {children}
    </article>
  )
}
