// All shipped layers occupy this canvas. Registration happens once at asset import,
// never per character combination. Coordinates are in template pixels.
export const TEMPLATE = Object.freeze({ id: 'frontal-painted-v1', width: 1024, height: 1024 });
export const ANCHORS = Object.freeze({
  headCenter: [512, 440],
  hairAnchor: [512, 180],
  eyeLeft: [424, 460],
  eyeRight: [600, 460],
  browLeft: [424, 421],
  browRight: [600, 421],
  noseCenter: [512, 559],
  mouthCenter: [512, 646],
  earLeft: [309, 501],
  earRight: [715, 501],
  neckCenter: [512, 824],
});
export const GUIDES = Object.freeze({
  hairline: 290,
  eyebrows: 421,
  eyes: 460,
  nose: 580,
  mouth: 646,
  chin: 766,
  neck: 824,
});

// Extra slots can be registered here without changing the compositor.
export const LAYERS = Object.freeze([
  { slot: 'hair', piece: 'back', color: 'hair' },
  { slot: 'neck', color: 'skin' },
  { slot: 'ears', color: 'skin' },
  { slot: 'head', color: 'skin' },
  { slot: 'nose', color: 'skin' },
  { slot: 'hair', piece: 'front', color: 'hair' },
]);
