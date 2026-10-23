import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <Link to="/">Back to home</Link>
    </section>
  )
}

export default NotFoundPage
