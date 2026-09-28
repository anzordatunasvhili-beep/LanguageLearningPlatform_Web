import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { safeAppRedirect } from '../../lib/authConfig.js';
import { useAuth } from './AuthProvider.jsx';

const copy = {
  login: {
    eyebrow: 'YOUR NEXT CHAPTER',
    title: 'Welcome back, explorer.',
    description: 'A little practice. A whole new world.',
    button: 'Sign in',
  },
  register: {
    eyebrow: 'A WORLD OF POSSIBILITIES',
    title: 'Every adventure starts here.',
    description: 'Create your account and make the world a little more yours.',
    button: 'Create account',
  },
  reset: {
    eyebrow: 'LET’S GET YOU BACK',
    title: 'Forgot your password?',
    description: 'We’ll send you a link to choose a new one.',
    button: 'Send reset link',
  },
  update: {
    eyebrow: 'A FRESH START',
    title: 'Choose a new password.',
    description: 'Make it unique, memorable, and at least 8 characters.',
    button: 'Save new password',
  },
};

export default function AuthPage({ mode = 'login' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const current = copy[mode] || copy.login;
  const next = safeAppRedirect(
    location.state?.from || new URLSearchParams(location.search).get('next'),
  );
  const isAccountForm = mode === 'login' || mode === 'register';

  useEffect(() => {
    setMessage('');
    setFormError('');
  }, [mode]);
  useEffect(() => {
    if (!auth.loading && auth.user && isAccountForm)
      navigate(auth.isPasswordRecovery ? '/auth/update-password' : next, { replace: true });
  }, [auth.loading, auth.user, auth.isPasswordRecovery, isAccountForm, navigate, next]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    setFormError('');
    try {
      if (mode === 'reset') {
        await auth.resetPassword(String(form.get('email')));
        setMessage(
          'If an account uses this email, a password reset link is on its way. Check your inbox.',
        );
      } else if (mode === 'update') {
        if (form.get('password') !== form.get('confirmPassword'))
          throw new Error('Your passwords do not match.');
        await auth.updatePassword(String(form.get('password')));
        navigate('/app/dashboard', { replace: true });
      } else if (mode === 'register') {
        const data = await auth.signUp({
          email: String(form.get('email')),
          password: String(form.get('password')),
          displayName: String(form.get('displayName')),
          next,
        });
        if (!data.session)
          setMessage('Check your email to verify your account, then return here to sign in.');
      } else {
        await auth.signIn({
          email: String(form.get('email')),
          password: String(form.get('password')),
        });
      }
    } catch (failure) {
      setFormError(failure.message || 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function beginGoogle() {
    setBusy(true);
    setFormError('');
    try {
      await auth.signInWithGoogle(next);
    } catch (failure) {
      setFormError(failure.message || 'Google sign-in is unavailable.');
      setBusy(false);
    }
  }

  async function beginDemo() {
    setBusy(true);
    try {
      await auth.startDemo();
      navigate(next, { replace: true });
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-back" to="/">
        ← Back to home
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{current.eyebrow}</p>
        <h1 id="auth-title">{current.title}</h1>
        <p>{current.description}</p>
        {(formError || auth.error) && (
          <div className="notice notice-error" role="alert">
            {formError || auth.error}
          </div>
        )}
        {message && (
          <div className="notice notice-success" role="status">
            {message}
          </div>
        )}
        {auth.isDemo && (
          <div className="notice">
            <strong>Explore the local demo</strong>
            <p>
              Discover sample learning content with a local demo session. No email or password
              needed.
            </p>
            <button className="button button-primary" onClick={beginDemo} disabled={busy}>
              {busy ? 'Opening…' : 'Enter demo world →'}
            </button>
          </div>
        )}
        {!auth.isDemo && (
          <>
            {isAccountForm && (
              <>
                <button
                  className="button button-secondary auth-google"
                  onClick={beginGoogle}
                  disabled={busy || !auth.isConfigured}
                >
                  <span aria-hidden="true">G</span> Continue with Google
                </button>
                <div className="auth-divider">
                  <span>or use your email</span>
                </div>
              </>
            )}
            {mode === 'update' && !auth.loading && !auth.user ? (
              <div className="notice">
                Open the password reset link from your email to set a new password.{' '}
                <Link to="/auth/reset-password">Request a new link</Link>.
              </div>
            ) : (
              <form onSubmit={submit} aria-busy={busy}>
                {mode === 'register' && (
                  <label className="field">
                    Display name
                    <input
                      name="displayName"
                      autoComplete="name"
                      placeholder="What should we call you?"
                      required
                      minLength={2}
                      maxLength={60}
                    />
                  </label>
                )}
                {mode !== 'update' && (
                  <label className="field">
                    Email address
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                    />
                  </label>
                )}
                {mode !== 'reset' && (
                  <label className="field">
                    {mode === 'update' ? 'New password' : 'Password'}
                    <input
                      name="password"
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={mode === 'login' ? undefined : 8}
                      maxLength={128}
                      required
                      placeholder={
                        mode === 'login' ? 'Enter your password' : 'At least 8 characters'
                      }
                    />
                  </label>
                )}
                {mode === 'update' && (
                  <label className="field">
                    Confirm new password
                    <input
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                  </label>
                )}
                {mode === 'login' && (
                  <Link className="auth-forgot" to="/auth/reset-password">
                    Forgot password?
                  </Link>
                )}
                <button
                  className="button button-primary auth-submit"
                  type="submit"
                  disabled={busy || auth.loading || !auth.isConfigured}
                >
                  {busy ? 'Just a moment…' : current.button}
                </button>
              </form>
            )}
          </>
        )}
        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              New around here? <Link to="/auth/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/auth/login">Sign in</Link>
            </>
          )}
        </p>
        <p className="auth-footnote">Your language journey. Your own pace.</p>
      </section>
    </main>
  );
}
