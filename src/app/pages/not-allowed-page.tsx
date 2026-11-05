import { Link } from 'react-router-dom';
import { paths } from '../../common/config/paths.ts';

export function NotAllowedPage() {
  return (
    <section>
      <h1>Not allowed</h1>
      <p>Only workspace admins can open this page.</p>
      <Link to={paths.chat}>Back to chat</Link>
    </section>
  );
}
