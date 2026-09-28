import { safeStorage } from '../../lib/safeStorage.js';

const preferenceKey = 'kotoba.learning.preferences.v1';
export const defaultPreferences = { language: 'all', dailyMinutes: 10 };
export function readPreferences() {
  try {
    const saved = JSON.parse(safeStorage.getItem(preferenceKey) || 'null');
    return {
      language: ['all', 'ja', 'es', 'fr'].includes(saved?.language)
        ? saved.language
        : defaultPreferences.language,
      dailyMinutes: [5, 10, 15, 20].includes(saved?.dailyMinutes)
        ? saved.dailyMinutes
        : defaultPreferences.dailyMinutes,
    };
  } catch {
    return { ...defaultPreferences };
  }
}
export function savePreferences(preferences) {
  return safeStorage.setItem(preferenceKey, JSON.stringify(preferences));
}
