import { client, unwrap, perform, currentUserId } from './platformService.js';
import { avatarAssets, defaultAvatar } from '../features/avatar/avatarCatalog.js';
export const avatarRepository = {
  async load() {
    const uid = await currentUserId();
    const [catalog, owned, avatar] = await Promise.all([
      unwrap(
        client()
          .from('avatar_assets')
          .select('*, versions:avatar_asset_versions(*)')
          .eq('enabled', true),
      ),
      unwrap(client().from('user_cosmetics').select('asset_id').eq('user_id', uid)),
      unwrap(
        client()
          .from('avatars')
          .select(
            '*, equipment:avatar_equipment(*, version:avatar_asset_versions(version, asset:avatar_assets(asset_key)))',
          )
          .eq('user_id', uid)
          .eq('is_primary', true)
          .maybeSingle(),
      ),
    ]);
    const available = catalog.flatMap((asset) =>
      asset.versions
        .filter(
          (v) =>
            v.status === 'published' &&
            avatarAssets.some(
              (a) => a.assetKey === asset.asset_key && a.assetVersion === v.version,
            ),
        )
        .map((v) => ({
          assetKey: asset.asset_key,
          assetVersion: v.version,
          slot: asset.category,
          label: asset.name,
          unlocked: asset.is_free || owned.some((o) => o.asset_id === asset.id),
        })),
    );
    const definition = avatar?.equipment.length
      ? {
          schemaVersion: avatar.schema_version,
          avatarId: avatar.id,
          modelFamily: avatar.model_family,
          selections: avatar.equipment.map((e) => ({
            slot: e.slot,
            assetKey: e.version.asset.asset_key,
            assetVersion: e.version.version,
            options: e.options,
          })),
        }
      : structuredClone(defaultAvatar);
    return { available, definition };
  },
  save: (definition) => perform('save_avatar', definition),
};
