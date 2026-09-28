import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/authService.js';
import { authConfig, supabase } from '../../lib/supabase.js';
import { safeStorage } from '../../lib/safeStorage.js';

const AuthContext = createContext(null);
const DEMO_SESSION_KEY = 'kotoba.demo.session.v1';
const demoUser = { id: 'local-demo-player', email: null, user_metadata: { display_name: 'Alex' } };
const demoProfile = {
  id: demoUser.id,
  display_name: 'Alex',
  username: 'alex',
  country: null,
  native_language_id: null,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    authConfig.isDemo && safeStorage.getItem(DEMO_SESSION_KEY) === 'active' ? demoUser : null,
  );
  const [profile, setProfile] = useState(() =>
    authConfig.isDemo && safeStorage.getItem(DEMO_SESSION_KEY) === 'active' ? demoProfile : null,
  );
  const [role, setRole] = useState(authConfig.isDemo ? 'learner' : null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState(authConfig.error);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    let revision = 0;
    const timers = new Set();

    function applySession(session, event) {
      if (!active) return;
      const requestRevision = ++revision;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(null);
      setRole(null);
      setError(null);
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (!nextUser) {
        setLoading(false);
        setIsPasswordRecovery(false);
        return;
      }
      setLoading(true);
      // Leave the synchronous Supabase auth callback before making another
      // Supabase request: awaiting it inside onAuthStateChange can deadlock.
      const timer = setTimeout(async () => {
        timers.delete(timer);
        try {
          const identity = await authService.getIdentity(nextUser.id);
          if (!active || requestRevision !== revision) return;
          setProfile(identity.profile);
          setRole(identity.role);
          if (identity.error)
            setError(
              'Your account is signed in, but profile services could not load. Please try again shortly.',
            );
        } catch {
          if (!active || requestRevision !== revision) return;
          setError('Your account is signed in, but profile services are unavailable.');
          setRole('learner');
        } finally {
          if (active && requestRevision === revision) setLoading(false);
        }
      }, 0);
      timers.add(timer);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => applySession(session, event));
    // Also surface initialization errors; auth events remain authoritative if
    // they arrive while this promise is pending.
    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active || revision !== 0) return;
        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
        } else applySession(data.session, 'INITIAL_SESSION');
      })
      .catch(() => {
        if (active && revision === 0) {
          setError('Unable to restore your account session. Please sign in again.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
      revision += 1;
      timers.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const startDemo = useCallback(async () => {
    if (!authConfig.isDemo) throw new Error('Local demo mode is not enabled.');
    safeStorage.setItem(DEMO_SESSION_KEY, 'active');
    setUser(demoUser);
    setProfile(demoProfile);
    setRole('learner');
    setError(null);
    return { user: demoUser };
  }, []);

  const signOut = useCallback(async () => {
    if (authConfig.isDemo) {
      safeStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setProfile(null);
      setRole('learner');
      return;
    }
    await authService.signOut();
  }, []);

  const updatePassword = useCallback(async (password) => {
    const data = await authService.updatePassword(password);
    setIsPasswordRecovery(false);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      role,
      loading,
      error,
      isDemo: authConfig.isDemo,
      isConfigured: authConfig.mode === 'supabase',
      isPasswordRecovery,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signInWithGoogle: authService.signInWithGoogle,
      resetPassword: authService.resetPassword,
      updatePassword,
      signOut,
      startDemo,
    }),
    [user, profile, role, loading, error, isPasswordRecovery, updatePassword, signOut, startDemo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
