import { NavLink, Outlet } from 'react-router-dom'

function App() {
  return (
    <>
      <header className="app-header">
        <strong>Documents AI</strong>
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
