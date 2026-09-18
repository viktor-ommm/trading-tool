import type { ComponentType, LazyExoticComponent } from 'react'
import type { IconName } from '../ui/icons'

/** Lifecycle of a tool. `planned` tools are listed but not usable yet. */
export type ToolStatus = 'ready' | 'planned'

export interface Tool {
  /** URL slug: `/tools/<id>`. Must be unique and stable — it is a public link. */
  id: string
  title: string
  /** One line shown on the home grid and under the tool heading. */
  summary: string
  icon: IconName
  status: ToolStatus
  /** Lazily loaded so each tool ships as its own chunk. */
  Component: LazyExoticComponent<ComponentType>
}
