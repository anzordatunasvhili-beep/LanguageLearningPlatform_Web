import {
  avatarAssets,
  defaultAvatar,
  palettes,
  appearanceSlots,
} from '../features/avatar/avatarCatalog.js';

/** Portable v1 contract. TODO: resolve catalog versions through the authenticated platform API for Godot/mobile. */
export function validateAvatar(definition) {
  if (
    !definition ||
    definition.schemaVersion !== 1 ||
    definition.modelFamily !== 'humanoid-v1' ||
    typeof definition.avatarId !== 'string' ||
    definition.avatarId.length > 100 ||
    !definition.avatarId ||
    !Array.isArray(definition.selections) ||
    definition.selections.length !== 3
  )
    return false;
  const slots = new Set();
  return definition.selections.every((selection) => {
    if (!selection || slots.has(selection.slot)) return false;
    slots.add(selection.slot);
    const asset = avatarAssets.find(
      (item) =>
        item.assetKey === selection.assetKey &&
        item.assetVersion === selection.assetVersion &&
        item.slot === selection.slot,
    );
    const appearanceCategory = Object.keys(appearanceSlots).find(
      (category) => appearanceSlots[category] === selection.slot,
    );
    const colors = palettes[appearanceCategory];
    return Boolean(
      asset &&
      colors?.includes(selection.options?.tint) &&
      Object.keys(selection.options).length === 1,
    );
  });
}
export function avatarAppearance(definition) {
  if (!validateAvatar(definition)) throw new Error('Unsupported avatar definition.');
  const selection = Object.fromEntries(definition.selections.map((item) => [item.slot, item]));
  return {
    skin: selection.body.options.tint,
    hair: selection.hair.options.tint,
    outfit: selection.top.options.tint,
    style: selection.hair.assetKey === 'hair.soft-bob' ? 'bob' : 'short',
  };
}
export function exportAvatar(definition) {
  if (!validateAvatar(definition)) throw new Error('Unsupported avatar definition.');
  // Serialize only the allowlisted portable contract, never arbitrary attached account data.
  return JSON.stringify(
    {
      schemaVersion: 1,
      avatarId: definition.avatarId,
      modelFamily: definition.modelFamily,
      selections: definition.selections.map(({ slot, assetKey, assetVersion, options }) => ({
        slot,
        assetKey,
        assetVersion,
        options: { tint: options.tint },
      })),
    },
    null,
    2,
  );
}
export const avatarService = {
  loadDraft(userId = 'demo') {
    try {
      const value = JSON.parse(localStorage.getItem(`kotoba.avatar.v1.${userId}`));
      if (validateAvatar(value)) return value;
    } catch {
      /* A blocked or stale local draft must not prevent previewing. */
    }
    return structuredClone(defaultAvatar);
  },
  saveDraft(definition, userId = 'demo') {
    localStorage.setItem(`kotoba.avatar.v1.${userId}`, exportAvatar(definition));
  },
};
