import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { Icon } from '../components/ui/index.jsx';

export default function AdminLayout() {
  const { isDemo, error } = useAuth();
  return (
    <div className="admin-shell">
      <header className="public-header">
        <Link className="brand" to="/admin">
          kotoba<span className="brand-dot">.</span>
          <span className="badge">STUDIO</span>
        </Link>
        <Link className="text-link" to="/app/dashboard">
          <Icon name="arrow_back" /> Back to your world
        </Link>
      </header>
      <div className="admin-container">
        <nav className="admin-nav" aria-label="Administration">
          <NavLink to="/admin" end>
            Overview
          </NavLink>
          <NavLink to="/admin/pdf-templates">PDF templates</NavLink>
        </nav>
        <main id="main-content" className="page-stack">
          <div className="notice">
            {isDemo
              ? 'Admin preview — sample content only. This does not grant a platform administrator role.'
              : 'Content studio foundation — editors currently preview sample content; publishing is not connected.'}
          </div>
          {error && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
