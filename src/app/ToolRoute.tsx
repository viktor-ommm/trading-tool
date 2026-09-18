import { Navigate, useParams } from 'react-router'
import { findTool, movedTools } from '../tools/registry'
import { NotFound } from './NotFound'

/** Resolves `/tools/:toolId` against the registry and renders that tool. */
export function ToolRoute() {
  const { toolId } = useParams()
  const tool = findTool(toolId)

  if (tool) return <tool.Component />

  const movedTo = toolId ? movedTools[toolId] : undefined
  if (movedTo) return <Navigate to={`/tools/${movedTo}`} replace />

  return <NotFound />
}
