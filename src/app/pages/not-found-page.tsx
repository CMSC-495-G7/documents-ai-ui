import { Link } from 'react-router-dom'
import { paths } from '../../common/config/paths.ts'

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <Link to={paths.chat}>Back to chat</Link>
    </section>
  )
}
