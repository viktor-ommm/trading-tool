import { lazy } from 'react'
import type { Tool } from './types'
import { meta as positionSize } from './position-size/meta'
import { meta as stopLoss } from './stop-loss/meta'
import { meta as scaling } from './scaling/meta'

/**
 * The single source of truth for what this toolkit contains.
 *
 * To add a tool: create `src/tools/<id>/` with a `meta.ts` and a default-exported
 * component, then append an entry here. Routes, the sidebar and the home grid all
 * read from this list.
 */
export const tools: Tool[] = [
  {
    ...positionSize,
    status: 'ready',
    Component: lazy(() => import('./position-size/PositionSizeCalculator')),
  },
  {
    ...stopLoss,
    status: 'ready',
    Component: lazy(() => import('./stop-loss/StopLossCalculator')),
  },
  {
    ...scaling,
    status: 'ready',
    Component: lazy(() => import('./scaling/ScalingCalculator')),
  },
]

export function findTool(id: string | undefined): Tool | undefined {
  return tools.find(tool => tool.id === id)
}

/**
 * Old tool ids that still get linked to. `ToolRoute` redirects these to their
 * current home instead of showing a 404.
 */
export const movedTools: Record<string, string> = {
  // Split into two separate tools.
  'risk-calculator': 'stop-loss',
  // Placeholder replaced by the scaling ledger.
  'risk-reward': 'scaling',
}
