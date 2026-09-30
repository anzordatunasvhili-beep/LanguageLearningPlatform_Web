const part = (id, label, extra = {}) => ({ id, label, ...extra });
export const PARTS = {
  head: [part('head-a', 'A · Sculpted'), part('head-b', 'B · Broad')],
  hair: [part('hair-a', 'A · Swept crop'), part('hair-b', 'B · Layered bob')],
  nose: [part('nose-a', 'A · Straight'), part('nose-b', 'B · Strong tip')],
  eyes: [part('eyes-a', 'Painted eye rig')],
  brows: [part('brows-a', 'Painted brow rig')],
  mouth: [part('mouth-a', 'Painted mouth rig')],
  ears: [part('ears-a', 'Classic')],
  neck: [part('neck-a', 'Classic')],
};
export const EDITABLE_SLOTS = ['head', 'hair', 'nose'];
export const SLOT_LABELS = {
  head: 'Head shape',
  hair: 'Hair style',
  nose: 'Nose',
  eyes: 'Eyes',
  brows: 'Eyebrows',
  mouth: 'Mouth',
};
export const PALETTES = {
  skin: ['#edc6a4', '#d6a377', '#b88057', '#89583c', '#593e32'],
  hair: ['#3e3027', '#201e22', '#855139', '#b88a55', '#b7b0a4'],
  eyes: ['#856546', '#465f70', '#62745b', '#a88447', '#4a3e38'],
  brows: ['#3e3027', '#201e22', '#855139', '#9c805d'],
  lips: ['#a56350', '#bd806d', '#804f49', '#a34e55'],
};
