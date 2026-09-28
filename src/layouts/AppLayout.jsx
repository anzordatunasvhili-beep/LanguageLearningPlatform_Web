import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { Icon, Button } from '../components/ui/index.jsx';

const navigation = [
  {
    label: 'YOUR WORLD',
    items: [
      ['Dashboard', 'space_dashboard', '/app/dashboard'],
      ['Learning path', 'school', '/app/learn'],
      ['Practice & play', 'sports_esports', '/app/games'],
      ['Characters', 'forum', '/app/ai/characters'],
      ['My avatar', 'accessibility_new', '/app/avatar'],
    ],
  },
  {
    label: 'GO FURTHER',
    items: [
      ['Leaderboard', 'leaderboard', '/app/leaderboards'],
      ['Achievements', 'workspace_premium', '/app/achievements'],
      ['Opportunities', 'travel_explore', '/app/opportunities'],
      ['Study rooms', 'groups', '/app/rooms'],
      ['My library', 'menu_book', '/app/library'],
    ],
  },
];

export default function AppLayout() {
  const { profile, isDemo, role, signOut, error } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const displayName = profile?.display_name || (isDemo ? 'Alex' : 'Explorer');
  const profilePath = profile?.username
    ? `/app/profile/${encodeURIComponent(profile.username)}`
    : '/app/settings';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside id="app-navigation" className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link className="brand" to="/app/dashboard">
          <span className="brand-mark">k</span>kotoba<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">A WORLD OF POSSIBILITIES</div>
        <nav aria-label="Main navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([label, icon, to]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                  {label === 'Characters' && <span className="nav-new">NEW</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="auto_awesome" />
            <p>
              Your next chapter
              <br />
              <strong>starts with a word.</strong>
            </p>
          </div>
          {(isDemo || role === 'admin') && (
            <Link className="nav-item" to="/admin">
              <Icon name="admin_panel_settings" />
              {isDemo ? 'Admin preview' : 'Administration'}
            </Link>
          )}
          <Link className="sidebar-profile" to={profilePath}>
            <div className="avatar-initial">{displayName.slice(0, 1)}</div>
            <div>
              <strong>{displayName}</strong>
              <small>
                {isDemo
                  ? 'Sample explorer account'
                  : profile
                    ? 'Your explorer account'
                    : 'Account settings'}
              </small>
            </div>
            <Icon name="chevron_right" />
          </Link>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              className="mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="app-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="menu" />
            </Button>
            <span className="breadcrumb">
              Your world <Icon name="chevron_right" />{' '}
              <strong>
                {navigation
                  .flatMap((g) => g.items)
                  .find((item) => location.pathname.startsWith(item[2]))?.[0] || 'Explore'}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <Link className="language-switch" to="/app/learn">
              <span className="japan-dot" /> Japanese <Icon name="expand_more" />
            </Link>
            <span className="topbar-divider" />
            <span className="streak-chip" title="Sample streak" aria-label="Sample streak: 12 days">
              <Icon name="local_fire_department" />
              <small>Sample</small> 12 <span>day streak</span>
            </span>
            <Link className="icon-button" aria-label="Account settings" to="/app/settings">
              <Icon name="settings" />
            </Link>
            <Button
              variant="ghost"
              aria-label="Sign out"
              onClick={async () => {
                setSignOutError('');
                try {
                  await signOut();
                } catch {
                  setSignOutError('Could not sign out. Please try again.');
                }
              }}
            >
              <Icon name="logout" />
            </Button>
          </div>
        </header>
        <main id="main-content" className="app-main">
          <div className="demo-ribbon">
            <span className="status-dot" /> FOUNDATION PREVIEW{' '}
            <span>Sample learning content and progression</span>
          </div>
          {error && (
            <p role="alert" className="notice notice-error">
              {error}
            </p>
          )}
          {signOutError && (
            <p role="alert" className="notice notice-error">
              {signOutError}
            </p>
          )}
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Small steps. New worlds.</span>
          <span>Kotoba · Foundation 01</span>
        </footer>
      </div>
    </div>
  );
}
