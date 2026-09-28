import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider.jsx';

export default function AdminRoute() {
  const { user, role, isDemo, loading, isPasswordRecovery, error } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="route-loading" role="status">
        Checking access…
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/auth/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  if (isPasswordRecovery) return <Navigate to="/auth/update-password" replace />;
  if (isDemo) return <Outlet />;
  if (role !== 'admin')
    return (
      <section className="auth-card">
        <p className="eyebrow">Access restricted</p>
        <h1>This workspace is for administrators.</h1>
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        <p>Your learning account is ready to use.</p>
        <Link className="button button-primary" to="/app/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  // This is a navigation guard, not the security boundary. RLS and trusted
  // server functions independently authorize every administrative operation.
  return <Outlet />;
}
