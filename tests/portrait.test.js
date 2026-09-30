import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCharacter,
  cleanCharacter,
  validateCharacter,
  catalogCharacter,
} from '../src/features/characters/portrait/data/character.js';
import { PARTS } from '../src/features/characters/portrait/data/parts.js';
import { expressionPose } from '../src/features/characters/portrait/rig/presets.js';
import { layerPlan, tintChannel } from '../src/features/characters/portrait/renderRaster.js';

test('retained head/hair/nose combinations keep static asset paths across expressions', () => {
  const slots = ['head', 'hair', 'nose'];
  for (let bits = 0; bits < 8; bits++) {
    const character = createCharacter();
    slots.forEach((slot, i) => {
      character.parts[slot] = PARTS[slot][(bits >> i) & 1].id;
    });
    const snapshot = JSON.stringify(character);
    assert.equal(validateCharacter(character), true);
    for (const expression of ['neutral', 'happy', 'serious']) {
      for (const speaking of [false, true]) {
        const plan = layerPlan(character, expression, { speaking });
        assert.equal(plan.length, 6);
        assert.equal(plan[0].id, character.parts.hair + '-back');
        assert.equal(plan.at(-1).id, character.parts.hair + '-front');
        assert.deepEqual(plan, layerPlan(character, 'neutral'));
        assert.equal(JSON.stringify(character), snapshot);
      }
    }
  }
});
test('legacy face selections migrate to one base rig without losing colors', () => {
  const value = createCharacter();
  value.parts.eyes = 'eyes-b';
  value.parts.brows = 'brows-b';
  value.parts.mouth = 'mouth-b';
  const migrated = cleanCharacter(value);
  assert.equal(migrated.parts.eyes, 'eyes-a');
  assert.equal(migrated.parts.brows, 'brows-a');
  assert.equal(migrated.parts.mouth, 'mouth-a');
  assert.deepEqual(migrated.colors, value.colors);
  assert.deepEqual(expressionPose('unrecognized'), expressionPose('neutral'));
});
test('import validates version, references and colors; export strips unrelated information', () => {
  const input = { ...createCharacter(), email: 'private@example.test' };
  assert.equal(Object.hasOwn(cleanCharacter(input), 'email'), false);
  for (const mutate of [
    (v) => {
      v.schemaVersion = 2;
    },
    (v) => {
      v.parts.head = 'https://example.com/face.png';
    },
    (v) => {
      v.colors.skin = 'url(javascript:alert(1))';
    },
    (v) => {
      delete v.parts.nose;
    },
  ]) {
    const bad = createCharacter();
    mutate(bad);
    assert.throws(() => cleanCharacter(bad), /Unsupported/);
  }
});
test('catalog identity is deterministic and honors authored portrait definitions', () => {
  const old = {
    slug: 'haruka',
    presentation: { appearance: { hair: '#855139', skin: '#b88057', style: 'bob' } },
  };
  assert.deepEqual(catalogCharacter(old), catalogCharacter(old));
  assert.equal(catalogCharacter(old).parts.hair, 'hair-b');
  const custom = createCharacter();
  custom.parts.nose = 'nose-b';
  assert.deepEqual(catalogCharacter({ presentation: { portrait: custom } }), custom);
});
test('raster color mapping preserves ink, highlights and monotonic shading', () => {
  assert.equal(tintChannel(0, 150, 85), 0);
  assert.equal(tintChannel(255, 150, 85), 255);
  assert.equal(tintChannel(150, 150, 85), 85);
  let previous = -1;
  for (let value = 0; value <= 255; value++) {
    const next = tintChannel(value, 150, 85);
    assert.ok(next >= previous);
    previous = next;
  }
});
