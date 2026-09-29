import { client, unwrap, perform } from './platformService.js';

export const learningService = {
  languages: () => unwrap(client().from('languages').select('*').eq('enabled', true).order('name')),
  listCourses: () =>
    unwrap(
      client()
        .from('courses')
        .select('*, language:languages(*), units(id)')
        .eq('status', 'published')
        .order('title'),
    ),
  async course(id) {
    const course = await unwrap(
      client()
        .from('courses')
        .select('*, language:languages(*)')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle(),
    );
    if (!course) return null;
    const units = await unwrap(
      client()
        .from('units')
        .select('*, lessons(*)')
        .eq('course_id', id)
        .eq('status', 'published')
        .order('position'),
    );
    return {
      ...course,
      units: units.map((unit) => ({
        ...unit,
        lessons: unit.lessons
          .filter((l) => l.status === 'published')
          .sort((a, b) => a.position - b.position),
      })),
    };
  },
  lessons: () =>
    unwrap(
      client()
        .from('lessons')
        .select('*, unit:units(course:courses(id,title,language_id))')
        .eq('status', 'published')
        .order('title'),
    ),
  start: (lessonId, releaseId = null) => perform('start_practice', { lessonId, releaseId }),
  answer: (runId, exerciseId, answer) => perform('answer', { runId, exerciseId, answer }),
  finish: (runId) => perform('finish_practice', { runId }),
};
export const gameService = {
  list: () =>
    unwrap(
      client()
        .from('games')
        .select('*, releases:game_releases(*)')
        .eq('status', 'published')
        .order('name'),
    ),
  get: (id) =>
    unwrap(
      client()
        .from('games')
        .select('*, releases:game_releases(*)')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle(),
    ),
};
export const opportunityService = {
  list: () =>
    unwrap(
      client()
        .from('opportunities')
        .select('*, language:languages(*)')
        .eq('status', 'published')
        .eq('is_demo', false)
        .order('deadline', { nullsFirst: false }),
    ),
};
export const roomService = {
  list: () =>
    unwrap(
      client()
        .from('rooms')
        .select('*, language:languages(*)')
        .eq('status', 'published')
        .order('name'),
    ),
  memberships: () => unwrap(client().from('room_members').select('*')),
  join: (roomId) => perform('join_room', { roomId }),
  leave: (roomId) => perform('leave_room', { roomId }),
  feed: (roomId) => perform('room_feed', { roomId }),
  send: (roomId, body) => perform('send_message', { roomId, body }),
};
export const achievementService = {
  list: () => unwrap(client().from('achievements').select('*').eq('enabled', true).order('title')),
  progress: () => unwrap(client().from('user_achievements').select('*')),
};
export const leaderboardService = {
  list: ({ period = 'weekly', languageId = null } = {}) =>
    perform('leaderboard', { period, languageId }),
};
export const pdfService = {
  listTemplates: () =>
    unwrap(
      client()
        .from('pdf_templates')
        .select('*, language:languages(*)')
        .eq('status', 'published')
        .order('name'),
    ),
  list: () =>
    unwrap(
      client()
        .from('generated_materials')
        .select('id,title,status,created_at,template_id')
        .order('created_at', { ascending: false }),
    ),
  get: (id) => unwrap(client().from('generated_materials').select('*').eq('id', id).maybeSingle()),
  generate: (templateId) => perform('generate_material', { templateId }),
};
export const characterService = {
  list: () =>
    unwrap(
      client()
        .from('ai_characters')
        .select('*, language:languages(*), scenarios:ai_scenarios(*)')
        .eq('status', 'published')
        .order('name'),
    ),
  get: (id) =>
    unwrap(
      client()
        .from('ai_characters')
        .select('*, language:languages(*), scenarios:ai_scenarios(*)')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle(),
    ),
};
