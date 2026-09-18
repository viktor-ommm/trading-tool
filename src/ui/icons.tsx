/** Inline tool icons. 24x24 grid, `currentColor` stroke so they follow the theme. */

const icons = {
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V6l-8-3Z" />
      <path d="M12 8v4" />
      <path d="M12 15.5h.01" />
    </>
  ),
  scales: (
    <>
      <path d="M12 4v16" />
      <path d="M6 20h12" />
      <path d="M4 8h16" />
      <path d="m4 8-3 6a3 3 0 0 0 6 0L4 8Z" />
      <path d="m20 8-3 6a3 3 0 0 0 6 0l-3-6Z" />
    </>
  ),
  bars: (
    <>
      <path d="M3 21h18" />
      <rect x="4" y="13" width="4" height="5" rx="1" />
      <rect x="10" y="9" width="4" height="9" rx="1" />
      <rect x="16" y="4" width="4" height="14" rx="1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.75h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
} as const

export type IconName = keyof typeof icons

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
