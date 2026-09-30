import { Link, Outlet, useLocation } from 'react-router';
import { Icon } from '../components/ui/index.jsx';

export default function PublicLayout() {
  const isLanding = useLocation().pathname === '/';
  return (
    <div className={'public-shell' + (isLanding ? ' field-guide-shell' : '')}>
      <header className="public-header">
        <Link className="brand" to="/">
          <span className="brand-mark">k</span>kotoba<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Public navigation">
          {isLanding ? (
            <>
              <a href="#the-journey">The journey</a>
              <a href="#your-guides">Your guides</a>
            </>
          ) : (
            <>
              <Link to="/games">Play & learn</Link>
              <Link to="/opportunities">Explore the world</Link>
            </>
          )}
          <Link className="button button-secondary" to="/auth/login">
            Sign in <Icon name="arrow_forward" />
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="public-footer">
        <Link className="brand" to="/">
          kotoba.
        </Link>
        <span>A little practice. A bigger world.</span>
        <span>Kotoba · 2026</span>
      </footer>
    </div>
  );
}
