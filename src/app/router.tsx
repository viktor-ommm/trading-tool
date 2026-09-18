import { createBrowserRouter } from 'react-router'
import { HomePage } from './HomePage'
import { Layout } from './Layout'
import { NotFound } from './NotFound'
import { ToolRoute } from './ToolRoute'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'tools/:toolId', element: <ToolRoute /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  // Keeps routes correct under the GitHub Pages sub-path.
  { basename: import.meta.env.BASE_URL },
)
