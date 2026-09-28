import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { safeAppRedirect } from '../../lib/authConfig.js';
import { useAuth } from './AuthProvider.jsx';

export default function AuthCallback() {
  const { loading, user, error, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''));
  const callbackError =
    query.get('error_description') ||
    fragment.get('error_description') ||
    query.get('error') ||
    fragment.get('error');
  const next = safeAppRedirect(query.get('next'));

  useEffect(() => {
    if (!loading && user && !callbackError)
      navigate(isPasswordRecovery ? '/auth/update-password' : next, { replace: true });
  }, [loading, user, callbackError, isPasswordRecovery, next, navigate]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">YOUR JOURNEY CONTINUES</p>
        <h1>
          {loading
            ? 'Finishing sign-in…'
            : callbackError || !user
              ? 'Let’s try that again.'
              : 'You’re all set.'}
        </h1>
        {loading ? (
          <p role="status">Restoring your account securely.</p>
        ) : callbackError || error || !user ? (
          <>
            <p className="notice notice-error" role="alert">
              {callbackError ||
                error ||
                'This sign-in link is missing, expired, or already used. Please request a new link or sign in again.'}
            </p>
            <Link className="button button-primary" to="/auth/login">
              Back to sign in
            </Link>
          </>
        ) : (
          <p role="status">Opening your dashboard…</p>
        )}
      </section>
    </main>
  );
}
