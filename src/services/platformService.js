import { supabase } from '../lib/supabase.js';

export function client() {
  if (!supabase) throw new Error('Connect your Supabase project to use this feature.');
  return supabase;
}
export async function unwrap(request) {
  const { data, error } = await request;
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883')
      throw new Error(
        'The live platform update is not installed in Supabase yet. Run 20260929000100_live_platform.sql from the migrations folder.',
      );
    throw new Error(error.message || 'The request failed. Please try again.');
  }
  return data;
}
export const perform = (action, payload = {}) =>
  unwrap(client().rpc('platform_action', { p_action: action, p_payload: payload }));
export async function currentUserId() {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error('Please sign in again.');
  return data.user.id;
}
export function announceChange() {
  window.dispatchEvent(new Event('kotoba:data-changed'));
}
export const playerService = {
  async overview() {
    const uid = await currentUserId();
    const [
      progress,
      settings,
      languages,
      lessons,
      achievements,
      quests,
      questProgress,
      daily,
      notifications,
    ] = await Promise.all([
      unwrap(client().from('account_progress').select('*').eq('user_id', uid).single()),
      unwrap(client().from('user_settings').select('*').eq('user_id', uid).single()),
      unwrap(client().from('user_languages').select('*, language:languages(*)').eq('user_id', uid)),
      unwrap(
        client()
          .from('lesson_progress')
          .select('*, lesson:lessons(id,title,estimated_minutes)')
          .eq('user_id', uid),
      ),
      unwrap(
        client()
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', uid),
      ),
      unwrap(client().from('quests').select('*').eq('enabled', true)),
      unwrap(
        client()
          .from('user_quests')
          .select('*')
          .eq('user_id', uid)
          .order('period_start', { ascending: false }),
      ),
      unwrap(
        client()
          .from('daily_activity')
          .select('*')
          .eq('user_id', uid)
          .order('activity_date', { ascending: false })
          .limit(30),
      ),
      unwrap(
        client()
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(20),
      ),
    ]);
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const yesterday = new Date(`${today}T12:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const activeStreak =
      progress.last_activity_date &&
      progress.last_activity_date >= yesterday.toISOString().slice(0, 10)
        ? progress.current_streak
        : 0;
    return {
      progress: { ...progress, current_streak: activeStreak },
      settings,
      languages,
      lessons,
      achievements,
      quests,
      questProgress,
      daily,
      notifications,
      today,
    };
  },
  profile: (username) =>
    unwrap(client().from('profiles').select('*').eq('username', username).maybeSingle()),
  async saveProfile(values) {
    const uid = await currentUserId();
    return unwrap(client().from('profiles').update(values).eq('id', uid).select().single());
  },
  async saveSettings(values) {
    const uid = await currentUserId();
    return unwrap(
      client().from('user_settings').update(values).eq('user_id', uid).select().single(),
    );
  },
  readNotification: (id) =>
    unwrap(
      client().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id),
    ),
};
