import { client, currentUserId } from './platformService.js';
import { cleanCharacter, createCharacter } from '../features/characters/portrait/data/character.js';
const setupMessage =
  'Run supabase/migrations/20260930000100_modular_portraits.sql in Supabase SQL Editor to enable account portrait saving.';
const missing = (error) => ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(error?.code);
export const portraitRepository = {
  async load(userId) {
    const uid = userId || (await currentUserId());
    const { data, error } = await client()
      .from('user_portraits')
      .select('definition')
      .eq('user_id', uid)
      .maybeSingle();
    if (missing(error))
      return { definition: createCharacter(), setupRequired: setupMessage, saved: false };
    if (error) throw new Error(error.message);
    return {
      definition: data ? cleanCharacter(data.definition) : createCharacter(),
      saved: Boolean(data),
      setupRequired: '',
    };
  },
  async save(value) {
    const definition = cleanCharacter(value);
    const { data, error } = await client().rpc('save_portrait', { p_definition: definition });
    if (error) throw new Error(missing(error) ? setupMessage : error.message);
    return cleanCharacter(data);
  },
};
