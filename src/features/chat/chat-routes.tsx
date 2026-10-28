import type { RouteObject } from 'react-router-dom'
import { ChatPage } from './pages/chat-page.tsx'

export const chatRoutes: RouteObject[] = [
  { index: true, element: <ChatPage /> },
]
