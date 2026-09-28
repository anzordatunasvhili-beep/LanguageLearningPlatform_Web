import { createClient } from '@supabase/supabase-js';
import { parseAuthEnvironment } from './authConfig.js';
import { safeStorage } from './safeStorage.js';

export const authConfig = parseAuthEnvironment(import.meta.env);

/** A public client; all data access is independently enforced by PostgreSQL RLS. */
export const supabase =
  authConfig.mode === 'supabase'
    ? createClient(authConfig.url, authConfig.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: safeStorage,
        },
      })
    : null;
