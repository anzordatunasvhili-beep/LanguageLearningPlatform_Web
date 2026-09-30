import { PARTS, PALETTES } from './parts.js';
import { TEMPLATE } from './template.js';

export function createCharacter() {
  return {
    schemaVersion: 1,
    template: TEMPLATE.id,
    parts: Object.fromEntries(Object.entries(PARTS).map(([slot, parts]) => [slot, parts[0].id])),
    colors: Object.fromEntries(
      Object.entries(PALETTES).map(([key, colors]) => [key, colors[key === 'skin' ? 1 : 0]]),
    ),
  };
}
export function validateCharacter(value) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.template !== TEMPLATE.id ||
    !value.parts ||
    !value.colors
  )
    return false;
  return (
    Object.entries(PARTS).every(
      ([slot, list]) =>
        list.some((part) => part.id === value.parts[slot]) ||
        (['eyes', 'brows', 'mouth'].includes(slot) && value.parts[slot] === slot + '-b'),
    ) &&
    Object.keys(PALETTES).every(
      (key) => typeof value.colors[key] === 'string' && /^#[0-9a-f]{6}$/i.test(value.colors[key]),
    )
  );
}
export function cleanCharacter(value) {
  if (!validateCharacter(value))
    throw new Error('Unsupported portrait definition. Use a compatible portrait export.');
  return {
    schemaVersion: 1,
    template: TEMPLATE.id,
    parts: Object.fromEntries(
      Object.keys(PARTS).map((key) => [
        key,
        ['eyes', 'brows', 'mouth'].includes(key) ? PARTS[key][0].id : value.parts[key],
      ]),
    ),
    colors: Object.fromEntries(
      Object.keys(PALETTES).map((key) => [key, value.colors[key].toLowerCase()]),
    ),
  };
}
export function exportCharacter(value) {
  return JSON.stringify(cleanCharacter(value), null, 2);
}

// The same adapter is used in cards, introductions and conversations.
// Existing catalogs keep their saved palette until an authored portrait is supplied.
export function catalogCharacter(character = {}) {
  const presentation = character.presentation || {};
  if (validateCharacter(presentation.portrait)) return cleanCharacter(presentation.portrait);
  const result = createCharacter();
  const old = presentation.appearance || {};
  if (old.style === 'bob' || character.slug === 'haruka') {
    Object.assign(result.parts, {
      head: 'head-b',
      hair: 'hair-b',
      eyes: 'eyes-a',
      brows: 'brows-a',
      mouth: 'mouth-a',
    });
  }
  for (const [target, source] of [
    ['skin', 'skin'],
    ['hair', 'hair'],
    ['brows', 'hair'],
  ]) {
    if (/^#[0-9a-f]{6}$/i.test(old[source])) result.colors[target] = old[source];
  }
  return result;
}
