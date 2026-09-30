# Raster facial rig

Open `/character-lab` and choose **Facial rig**. The editor starts with one eye enlarged so its structure is visible. **Full portrait** shows the same rig in the character. **Appearance** opens the existing identity/color editor. The account editor, catalog cards, introductions, profiles and conversations all use the new `CharacterPortrait` renderer.

This replaces the earlier expression-image switching approach. There is **one facial part set**: a painted eyelid/skin texture, a round static sclera, a separate round iris/pupil/highlight, one brow texture, a lips/skin texture, and a mouth interior. The right eye and brow mirror the base geometry but have independent mesh state. Existing head/hair/nose alternatives are retained without generating additional character sets. Legacy eye/brow/mouth B selections normalize to this single rig; their palettes remain intact.

## Editor workflow

1. Select an eye, eyebrow or mouth with **Edit mesh**. Choose **Selected part** to zoom or **Full portrait** for context.
2. Turn on **Show mesh and points**. Drag P0–P15. Arrow keys move the focused vertex one template pixel; Shift moves five. Invalid folding or excessive displacement is rejected.
3. Use Normal / Wide / Narrow / Closed to inspect the selected eye. Six expression buttons move the same vertices; they do not change image sources.
4. Use Blink left/right/both and the two gaze sliders. Iris movement is separate from expression and decreases as the lid closes.
5. Inspect individual layers under **Asset layers**. Eyelids, eyes, irises, brows, mouth interior, lips and body can be hidden independently. Enable **Facial landmarks** for the common coordinates.
6. Name and **Save preset**. Presets persist in this browser. **Load preset**, **Export preset**, and **Import preset** round-trip all five control lattices. Imported data is versioned, size-limited and validated; it cannot reference arbitrary image URLs.

Preset storage is local authoring data. Account portrait identity still uses `user_portraits` and the existing `20260930000100_modular_portraits.sql` migration. This rig update requires **no additional database migration**. The previous portrait migration must still be installed for account identity saves.

## Source art and registration

Generated raster source and registered textures are under `public/characters/rig-v1/`. The five newly generated assets were made with built-in imagegen; exact prompts are in [facial-rig-generation-prompts.json](facial-rig-generation-prompts.json). The neutral brow is reused from the previous generated set. Source originals are retained as `*-source.png`.

| Texture | Role |
| --- | --- |
| `eye-white.png` | Static round sclera/socket shading |
| `iris.png` | Round iris, pupil and highlight; translates without squashing |
| `eye-front.png` | Painted skin, lid crease and eyelashes with a real transparent opening |
| `eye-opening.png` | Raster aperture mask extracted from that opening |
| `brow.png` | One neutral painted brow, independently deformed on each side |
| `mouth-front.png` | Painted lips/skin ring with transparent opening |
| `mouth-opening.png` | Raster aperture mask extracted from the lips |
| `mouth-interior.png` | Painted cavity, teeth and tongue behind the lips |

`scripts/prepare-rig-assets.mjs` registers the source pixels and extracts enclosed transparent regions by flood fill. It rejects images lacking real alpha or an enclosed opening. It produces textures at four times their logical rig dimensions for close-up editing. `registration.json` records native sizes, alpha bounds and aperture registration. This is authoring-time registration, not an expression effect.

The master canvas remains **1024 × 1024**. Cropped high-resolution facial textures are placed in fixed landmark rectangles from `rig/definition.js`. The eyelid opening maps into rows 1 and 2 of a 4 × 4 grid. Rest/UV coordinates never change; pose coordinates do. The same configuration therefore works with either retained head/hair option.

## Rendering and animation

The implementation uses Canvas 2D textured triangles, with no SVG, Three.js, Pixi dependency or runtime image generation. `mesh.js` provides the 4 × 4 lattice, validation, interpolation and triangle transforms. `warp.js` subdivides each grid cell and applies an affine texture mapping per triangle. This warps parts of the texture instead of scaling or rotating an entire facial image.

The eye painter draws the sclera normally, then draws a round iris at a clamped gaze offset. A separate offscreen surface deforms the aperture mask with the exact same vertices as the front eyelid texture. Destination-in compositing clips the eye contents to that opening. The skin/eyelashes mesh is painted above it. Eyebrows use separate lattices. The mouth repeats this structure with a static painted interior and deformable lips/mask.

Layer order in the renderer is explicit: back hair → neck → ears → head → nose → eyes → brows → mouth → front hair. Identity color variants are prepared once per identity load. Changes to pose/gaze do not recolor, reload or regenerate artwork.

`presets.js` contains neutral, happy, angry, sad, surprised and sleepy deformation values. `serious` aliases angry for existing scenarios. Mouth overrides cover closed, small/medium/wide open, smile and frown. Blinking is a transient opening deformation layered over the current expression, not saved identity or an image swap.

`renderer.js` interpolates vertex positions on `requestAnimationFrame` with eased timing. Interrupted transitions start from the current interpolated pose. React is not updated every animation frame: the renderer updates Canvas, and debug handles update their positions directly. The RAF loop stops when there is no transition or blink. Reduced-motion preferences disable expression interpolation; explicit blink controls remain available.

## Component and imperative API

```jsx
const portrait = useRef(null);
<CharacterPortrait ref={portrait} character={identity} expression="neutral" />;

portrait.current.setExpression('happy', 300);
portrait.current.setLookDirection(0.5, -0.2);
portrait.current.blink();
portrait.current.blinkLeft();
portrait.current.blinkRight();

// Authoring API, available after the rig is ready:
portrait.current.rig.setMouthState('mouth_medium_open', 180);
portrait.current.rig.getPreset('My expression');
portrait.current.rig.setPose(preset.pose, 300);
```

Identity `{schemaVersion, template, parts, colors}` is unchanged by these calls. Exported deformation presets contain `{rigVersion, name, pose}`; each pose has `leftEye`, `rightEye`, `leftBrow`, `rightBrow`, and `mouth`, each with sixteen `{x,y}` points. The `onRigReady` callback exposes the authoring API when textures finish loading.

## Incremental checks and limits

Development first verified one eye in normal/wide/narrow/closed poses, then brow geometry and gaze constraints, then mouth/preset interpolation, and finally the full component/editor. Browser checks exercise actual pointer dragging, keyboard nudging, save/reload/import/export, independent blinks, interpolation, idle RAF stopping, texture-request invariance, mobile layouts, account saving and catalog/conversation identity.

A diagnostic raster test counts an opaque iris through the real deformed aperture: wide > normal > narrow, with under 2% remaining at fully closed. The residual subpixel edge avoids degenerate triangles. This tests actual masking, not merely the numerical control-point values.

This is a working authoring prototype, not a complete Live2D implementation. The right eyelid/brow reuse mirrored artwork; asymmetrically authored lighting/art can be added later without changing independent control. Teeth/tongue are painted into the one interior texture in this set. There is no audio analysis, phoneme timing, auto-blink scheduler, head rotation or user-authored AI personality workflow. Final art polish, more detailed lip pigment masks and GPU batching for crowds remain future work.

Run `node --test tests/*.test.js`, `npm run build`, and—with Vite dev on port 5191—`node tests/browser-facial-rig.mjs`. Optional local browser/PGlite QA dependencies remain under `.tools`.
