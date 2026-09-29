import { authConfig, supabase } from '../lib/supabase.js';
import { safeAppRedirect } from '../lib/authConfig.js';

function requireClient() {
  if (!supabase)
    throw new Error(
      authConfig.error ||
        'This is a local demo. Account authentication requires a connected Supabase project.',
    );
  return supabase;
}

function callbackUrl(next = '/app/dashboard') {
  const callback = new URL('/auth/callback', window.location.origin);
  callback.searchParams.set('next', safeAppRedirect(next));
  return callback.toString();
}

async function unwrap(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

/** Authentication methods are isolated from routes and presentation. */
export const authService = {
  signIn({ email, password }) {
    return unwrap(requireClient().auth.signInWithPassword({ email: email.trim(), password }));
  },
  signUp({ email, password, displayName, next }) {
    return unwrap(
      requireClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl(next),
          data: { display_name: displayName.trim() },
        },
      }),
    );
  },
  signOut() {
    return unwrap(requireClient().auth.signOut({ scope: 'local' }));
  },
  signInWithGoogle(next) {
    return unwrap(
      requireClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl(next) },
      }),
    );
  },
  resetPassword(email) {
    return unwrap(
      requireClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl('/auth/update-password'),
      }),
    );
  },
  updatePassword(password) {
    return unwrap(requireClient().auth.updateUser({ password }));
  },
  async getIdentity(userId) {
    const client = requireClient();
    const [profileResult, roleResult] = await Promise.all([
      client
        .from('profiles')
        .select('id, username, display_name, country, native_language_id, is_public')
        .eq('id', userId)
        .maybeSingle(),
      client.rpc('get_my_role'),
    ]);
    return {
      profile: profileResult.data,
      // Never grant privileges from editable user_metadata or a local profile.
      role:
        !roleResult.error && ['learner', 'moderator', 'admin'].includes(roleResult.data)
          ? roleResult.data
          : 'learner',
      error: profileResult.error || roleResult.error,
    };
  },
};
