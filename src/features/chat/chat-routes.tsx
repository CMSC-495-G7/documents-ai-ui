import type { RouteObject } from 'react-router-dom';
import { ChatPage } from './pages/chat-page.tsx';

// One route for /chat and /chat/12, so the page and its history list
// stay put when another answer opens
export const chatRoutes: RouteObject[] = [
  { path: ':answerId?', element: <ChatPage /> },
];
