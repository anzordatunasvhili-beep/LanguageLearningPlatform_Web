export const avatarAssets = [
  { assetKey: 'body.traveler', assetVersion: 1, slot: 'body', label: 'Explorer base' },
  { assetKey: 'hair.soft-bob', assetVersion: 1, slot: 'hair', label: 'Soft bob' },
  { assetKey: 'hair.short-wave', assetVersion: 1, slot: 'hair', label: 'Cropped' },
  { assetKey: 'top.academy-jacket', assetVersion: 1, slot: 'top', label: 'Everyday jacket' },
];
export const palettes = {
  skin: ['#edc6ad', '#deb99e', '#c89470', '#80543e', '#533b30'],
  hair: ['#343735', '#8b5840', '#b9a07d', '#645568'],
  outfit: ['#747e69', '#637987', '#ad795c', '#504b60'],
};
// Presentation vocabulary is independent of the portable catalog categories.
export const appearanceSlots = { skin: 'body', hair: 'hair', outfit: 'top' };
export const defaultAvatar = {
  schemaVersion: 1,
  avatarId: 'local-explorer',
  modelFamily: 'humanoid-v1',
  selections: [
    { slot: 'body', assetKey: 'body.traveler', assetVersion: 1, options: { tint: '#deb99e' } },
    { slot: 'hair', assetKey: 'hair.soft-bob', assetVersion: 1, options: { tint: '#343735' } },
    { slot: 'top', assetKey: 'top.academy-jacket', assetVersion: 1, options: { tint: '#747e69' } },
  ],
};
