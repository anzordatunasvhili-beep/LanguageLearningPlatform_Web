/**
 * Read only public browser configuration. A partial live configuration must
 * never quietly switch an application into a local demo.
 * @param {Record<string, string | undefined>} env
 */
export function parseAuthEnvironment(env = {}) {
  const url = (env.VITE_SUPABASE_URL || '').trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const demoRequested = env.VITE_DEMO_MODE === 'true';
  const result = { mode: 'unconfigured', isDemo: false, url, key, error: null };

  if (!url && !key) {
    if (demoRequested) return { ...result, mode: 'demo', isDemo: true };
    return {
      ...result,
      error:
        'Account services are not configured. Set the public Supabase URL and publishable key, or explicitly enable the local demo.',
    };
  }
  if (!url || !key) {
    return {
      ...result,
      error:
        'The Supabase configuration is incomplete. Both the project URL and publishable key are required.',
    };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ...result, error: 'The Supabase project URL is invalid.' };
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (
    (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    return {
      ...result,
      error: 'Use an HTTPS Supabase project URL, or HTTP for local Supabase development.',
    };
  }

  // Legacy public anon JWTs are supported. A service-role key must never be
  // bundled into a browser application, even if supplied under a public name.
  let jwtRole;
  if (key.split('.').length === 3) {
    try {
      const payload = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      jwtRole = JSON.parse(atob(payload)).role;
    } catch {
      return { ...result, error: 'The Supabase public key is invalid.' };
    }
  }
  if (key.startsWith('sb_secret_') || jwtRole === 'service_role') {
    return {
      ...result,
      key: '',
      error:
        'A private Supabase key was supplied. Remove it from browser configuration and use a publishable key.',
    };
  }
  if (!key.startsWith('sb_publishable_') && jwtRole !== 'anon') {
    return { ...result, error: 'Use a Supabase publishable key or legacy public anon key.' };
  }
  return { ...result, mode: 'supabase' };
}

/** Only allow known application destinations after authentication. */
export function safeAppRedirect(value, fallback = '/app/dashboard') {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  try {
    const parsed = new URL(value, 'https://internal.invalid');
    if (parsed.origin !== 'https://internal.invalid' || /%|\\/.test(parsed.pathname))
      return fallback;
    const allowed =
      parsed.pathname === '/app' ||
      parsed.pathname.startsWith('/app/') ||
      parsed.pathname === '/admin' ||
      parsed.pathname.startsWith('/admin/') ||
      parsed.pathname === '/auth/update-password';
    return allowed ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}
