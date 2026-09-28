import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider.jsx';

export default function ProtectedRoute() {
  const { user, loading, isPasswordRecovery } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="route-loading" role="status">
        Opening your world…
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
  return <Outlet />;
}
