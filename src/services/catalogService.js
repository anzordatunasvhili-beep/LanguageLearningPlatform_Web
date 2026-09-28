import {
  courses,
  units,
  lessons,
  exercises,
  games,
  leaderboardEntries,
  opportunities,
  rooms,
  achievements,
  pdfTemplates,
} from '../data/catalog.js';

// Local catalog adapter: replace these reads at this boundary when published content is connected.
// TODO: use server-assessed exercise attempts before granting XP or writing progression.
export const learningService = {
  listCourses: () => courses,
  getCourse: (id) => courses.find((course) => course.id === id),
  listUnits: (courseId) => units.filter((unit) => unit.courseId === courseId),
  listLessons: (unitId) => lessons.filter((lesson) => lesson.unitId === unitId),
  getLesson: (id) => lessons.find((lesson) => lesson.id === id),
  getExercises: (lessonId) => exercises.filter((exercise) => exercise.lessonId === lessonId),
};
export const gameService = {
  list: () => games,
  get: (id) => games.find((game) => game.id === id),
  // TODO: external game clients submit signed, replay-protected result events to an authenticated API.
};
export const opportunityService = { list: () => opportunities };
export const roomService = { list: () => rooms }; // TODO: membership checks and moderated realtime rooms.
export const achievementService = { list: () => achievements };
export const leaderboardService = {
  list: ({ period = 'weekly', language = 'All languages' } = {}) =>
    leaderboardEntries
      .filter((entry) => language === 'All languages' || entry.language === language)
      .map((entry) => ({ ...entry, xp: period === 'weekly' ? entry.weeklyXp : entry.totalXp }))
      .sort((a, b) => b.xp - a.xp),
};
export const pdfService = {
  listTemplates: () => pdfTemplates,
  // Template validation is local; no AI invocation, document generation, or publication occurs.
  validateTemplate: (template) => {
    if (!template.name.trim()) return 'Give this template a name.';
    if (!template.sections.length) return 'Choose at least one section.';
    if (
      !Number.isInteger(Number(template.questionCount)) ||
      Number(template.questionCount) < 1 ||
      Number(template.questionCount) > 50
    )
      return 'Choose between 1 and 50 questions.';
    if (!template.instructions.trim()) return 'Add instructions for the learning material.';
    return null;
  },
  // TODO: privileged generation job -> validated structured content -> private PDF storage.
};
