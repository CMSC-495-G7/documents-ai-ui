import { NavLink, Outlet } from 'react-router-dom'
import { paths } from '../../common/config/paths.ts'

export function AppLayout() {
  return (
    <>
      <header className="app-header">
        <strong>Documents AI</strong>
        <nav>
          <NavLink to={paths.chat}>Chat</NavLink>
          <NavLink to={paths.ingestion}>Ingestion</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
