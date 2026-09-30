# Painted modular portraits

The first portrait prototype uses **28 separately generated raster layers**, assembled by a Canvas 2D compositor. It makes no image-generation requests at runtime. No SVG artwork or whole-portrait color filter is used. The landing-page illustrations remain separate editorial assets.

## Try it

- `/character-lab`: workshop with immediate part/color changes, neutral/happy/serious expressions, speaking mouth, comparison row, alignment overlay, JSON import/export, and a browser-local draft.
- `/app/avatar`: the same creator with account saving.
- Saved account portraits appear on profiles. Private profiles keep portraits private; public profiles make them visible to signed-in viewers.
- Catalog cards, introductions and conversations share the same character configuration. Existing catalog `presentation.appearance` values are adapted deterministically. New records can use `presentation.portrait`.

For account persistence, run `supabase/migrations/20260930000100_modular_portraits.sql` **after the existing migrations** in Supabase SQL Editor. It adds `user_portraits`, RLS and the `save_portrait` RPC. It preserves old avatars, equipment and cosmetics. The workshop needs no migration. A missing migration produces an explicit message in the account editor; it never claims a failed save succeeded.

This milestone implements visual identity, not a new AI personality-authoring workflow. Conversations still use published characters/scenarios and the existing configured AI backend. There is no audio lip sync; `speaking` is an explicit presentation input, never inferred from a network wait.

## Asset contract

All shipping layer PNGs in `public/characters/painted-v1/` have real alpha and an identical **1024 × 1024** canvas. Their faces are frontal with fixed camera orientation and upper-left illumination. They use painted angular planes and textured ink detail. The set contains:

| Part | Count |
| --- | ---: |
| Blank head bases | 2 |
| Hair front / back | 2 + 2 |
| Noses | 2 |
| Eye sets, three states each | 6 |
| Eyebrow sets, three states each | 6 |
| Mouth styles, closed / smile / speaking | 6 |
| Shared ear pair / neck | 1 + 1 |

`master-reference.png` is the original generated style reference. It is an authoring reference, never used as the rendered face. `master-template.png` is the registered, annotated 1024-square template. `registration.json` records source bounds and destination rectangles for every layer.

Generative outputs did not reliably obey requested pixel positions or native dimensions. `scripts/register-portrait-assets.mjs` therefore registers each generated part once, using its alpha bounds and the master landmarks. Paired eyes/brows/ears are registered individually. This preserves the painted pixels and outputs a common transparent canvas. No combination-specific offsets or procedural/vector replacement artwork are used. The original generated PNGs remain at their imagegen output paths; the project includes every registered shipping layer.

Generation used the built-in imagegen tool. The exact master and per-part prompts are in `docs/portrait-generation-prompts.json`. The master establishes the shared style; every part generation references that same master.

## Landmarks and composition

`src/features/characters/portrait/data/template.js` is the source of truth for canvas, anchors, guides and layer order. Positions include eyes `(418, 460)` and `(606, 460)`, brows at `y=410`, nose tip region around `(512, 559)`, mouth `(512, 656)`, chin `y=766`, and neck `(512, 824)`.

Order: back hair → neck → ears → head/skin → nose → eyes → eyebrows → mouth → front hair. Skin shading is painted into the corresponding head, nose and neck layers. Eyelids, sclera, pupils and iris detail belong to each eye-state PNG. Facial features are not baked into the head base.

The debug overlay uses these same landmarks. It is HTML/CSS guide markup over the raster canvas, not character artwork.

## Identity and expressions

```js
{
  schemaVersion: 1,
  template: 'frontal-painted-v1',
  parts: {
    head: 'head-a', hair: 'hair-a', nose: 'nose-a',
    eyes: 'eyes-a', brows: 'brows-a', mouth: 'mouth-a',
    ears: 'ears-a', neck: 'neck-a'
  },
  colors: {
    skin: '#d6a377', hair: '#3e3027', eyes: '#856546',
    brows: '#3e3027', lips: '#a56350'
  }
}
```

`CharacterPortrait` receives `character`, `expression`, `speaking`, optional `mouthState`, and `guides`. Emotion selects eye/brow/mouth states without modifying identity. Speaking overrides only the mouth; it keeps the chosen eye/brow emotion. The viseme map is explicit and currently provides closed, smile and medium-open states. Additional mouth states require authored raster assets and a mapping entry.

JSON imports validate schema, template, local part IDs and hex colors. Exports contain only the portable identity. The renderer never accepts arbitrary asset URLs from user configuration. Supabase validates the bounded JSON structure and enforces account ownership; shipped-part compatibility is checked in the application.

## Raster color variants

`renderRaster.js` generates cached raster variants in memory. Piecewise channel mapping preserves dark ink and bright highlights while shifting painted midtones. Skin, hair, brows and lips have separate palettes. Iris recoloring targets registered iris regions while preserving sclera/pupils and the surrounding skin. The original PNGs remain unchanged. A bounded cache prevents every color adjustment from accumulating another permanent bitmap.

The current iris/lip regions are prototype masks tied to this template. Future assets with substantially different geometry should ship explicit raster masks rather than reuse these regions. Extreme custom colors are allowed for experimentation; authored palette choices are the reviewed combinations. Additional art direction and hand cleanup may be appropriate before expanding this into a production character catalog.

## Adding parts

1. Author a transparent layer using the template, same frontal view, eye line, feature anchors, brush treatment and upper-left light.
2. Register it once, export a 1024-square PNG with the existing naming convention, and inspect it against both heads and hairstyles.
3. Add the stable ID and label to `data/parts.js`. For expression-bearing features, supply all supported state files. Existing-slot additions require no compositor changes.
4. New categories such as glasses/accessories add a slot to `data/template.js` in the appropriate layer order, a catalog entry, and a configuration default. Evolving templates should use a new version rather than silently changing existing character geometry.

Tests cover the 64 independent feature combinations with three emotions and a speaking override (384 compositions), portable identity, invalid imports, color mapping, responsive controls, browser drafts, account save/reload, profile display and catalog/conversation identity. Local SQL tests cover owner writes, cross-account isolation and public-profile visibility. Hosted Supabase deployment remains a separate setup step.
