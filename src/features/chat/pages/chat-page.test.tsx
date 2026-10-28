import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { paths } from '../../../common/config/paths.ts'
import { renderWithRouter } from '../../../testing/render-with-router.tsx'
import { chatRoutes } from '../chat-routes.tsx'

describe('ChatPage', () => {
  it('renders at the chat base path', () => {
    renderWithRouter([{ path: paths.chat, children: chatRoutes }], paths.chat)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Chat' }),
    ).toBeInTheDocument()
  })
})
