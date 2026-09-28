import { Link } from 'react-router';
import { Icon } from '../components/ui/index.jsx';
export default function NotFound() {
  return (
    <main className="empty-state error-page">
      <Icon name="explore_off" />
      <p className="eyebrow">A SMALL DETOUR · 404</p>
      <h1>This chapter hasn’t been written.</h1>
      <p>The page you’re looking for isn’t here.</p>
      <Link className="button button-primary" to="/">
        Return home
      </Link>
    </main>
  );
}
