import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAvatar, exportAvatar, avatarAppearance } from '../src/services/avatarService.js';
import { defaultAvatar, avatarAssets } from '../src/features/avatar/avatarCatalog.js';

test('portable avatar round-trips and strips unrelated account data', () => {
  const exported = JSON.parse(exportAvatar({ ...defaultAvatar, email: 'private@example.invalid' }));
  assert.deepEqual(exported, defaultAvatar);
  assert.deepEqual(avatarAppearance(exported), {
    skin: '#deb99e',
    hair: '#343735',
    outfit: '#747e69',
    style: 'bob',
  });
  assert.deepEqual(
    exported.selections.map((item) => item.slot),
    ['body', 'hair', 'top'],
  );
  assert.equal(exported.selections[1].assetKey, 'hair.soft-bob');
  assert.equal(exported.avatarId, 'local-explorer');
});
test('unsupported versions, duplicate slots and arbitrary assets are rejected', () => {
  assert.equal(validateAvatar({ ...defaultAvatar, schemaVersion: 2 }), false);
  const duplicate = structuredClone(defaultAvatar);
  duplicate.selections[1] = duplicate.selections[0];
  assert.equal(validateAvatar(duplicate), false);
  const malicious = structuredClone(defaultAvatar);
  malicious.selections[0].assetKey = 'https://untrusted.invalid/model.glb';
  assert.throws(() => exportAvatar(malicious), /Unsupported/);
  assert.equal(validateAvatar({ ...defaultAvatar, selections: [null, null, null] }), false);
});

test('asset category, version, tint and canonical field names are validated', () => {
  const cases = [
    (avatar) => {
      avatar.selections[0].assetKey = 'top.academy-jacket';
    },
    (avatar) => {
      avatar.selections[1].assetVersion = 2;
    },
    (avatar) => {
      avatar.selections[2].slot = 'outfit';
    },
    (avatar) => {
      avatar.selections[0].options = { color: '#deb99e' };
    },
    (avatar) => {
      avatar.selections[0].options.tint = 'url(https://untrusted.invalid)';
    },
    (avatar) => {
      avatar.selections[0].options.modelPath = '/untrusted.glb';
    },
    (avatar) => {
      avatar.selections[0].assetId = avatar.selections[0].assetKey;
      delete avatar.selections[0].assetKey;
    },
  ];
  for (const mutate of cases) {
    const avatar = structuredClone(defaultAvatar);
    mutate(avatar);
    assert.equal(validateAvatar(avatar), false);
  }
});

test('alternate hair uses the seeded stable key while preserving the renderer interface', () => {
  const avatar = structuredClone(defaultAvatar);
  const shortHair = avatarAssets.find((asset) => asset.assetKey === 'hair.short-wave');
  avatar.selections[1] = {
    slot: shortHair.slot,
    assetKey: shortHair.assetKey,
    assetVersion: shortHair.assetVersion,
    options: { tint: '#8b5840' },
  };
  assert.equal(validateAvatar(avatar), true);
  assert.deepEqual(avatarAppearance(avatar), {
    skin: '#deb99e',
    hair: '#8b5840',
    outfit: '#747e69',
    style: 'short',
  });
});
