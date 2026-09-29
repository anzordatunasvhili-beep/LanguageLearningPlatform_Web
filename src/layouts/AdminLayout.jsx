import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { adminResources } from '../features/admin/resources.js';
export default function AdminLayout() {
  const { error } = useAuth();
  return (
    <div className="admin-shell">
      <header className="public-header">
        <Link className="brand" to="/admin">
          kotoba.<span className="badge">STUDIO</span>
        </Link>
        <Link className="text-link" to="/app/dashboard">
          Back to your world
        </Link>
      </header>
      <div className="admin-container">
        <nav className="admin-nav" aria-label="Administration">
          <NavLink to="/admin" end>
            Overview
          </NavLink>
          {Object.entries(adminResources).map(([key, config]) => (
            <NavLink key={key} to={'/admin/' + key}>
              {config.title}
            </NavLink>
          ))}
        </nav>
        <main id="main-content" className="page-stack">
          {error && (
            <p role="alert" className="notice notice-error">
              {error}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
