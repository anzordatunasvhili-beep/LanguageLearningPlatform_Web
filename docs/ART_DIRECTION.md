# Illustrated character presentation

The landing page retains the rounded, modern minimalism of the application: warm ivory, generous spacing, soft cards, rounded buttons, editorial serif headings and readable sans-serif controls. The supplied concept-art reference influences the painterly characters and restrained autumn/terracotta accents. It does not dictate a poster layout or condensed headings.

Generated with the built-in image generation tool using the user's image as a style reference. These are original characters, not copies of the reference character.

## Saved assets

- `public/art/traveling-scholar.png`: landing-page hero illustration, 1024 × 1536.
- `public/art/autumn-scholar.png`: landing-page companion illustration, 1024 × 1536.

Source PNGs are preserved in the project. The hero loads eagerly; supporting illustrations load lazily.

## Generation prompts

### Traveling scholar

Use case: stylized-concept. Asset type: finished raster character illustration for a language-learning website hero and temporary character portrait.

Input image 1 is a STYLE REFERENCE only, not an edit target. Create an original character, not the reference character. Match the reference's painterly fantasy concept-art treatment: elegant ink contours, angular broad gouache brushwork, intricate layered clothing, realistic adult proportions, warm autumn palette, cream parchment, dark olive shadows, ochre and rust-red accents. High-end illustrated adventure art, not anime, not a cartoon avatar, not a 3D render.

Subject: one charismatic adult traveling scholar and language explorer, full body, softly expressive face, dark swept-back hair, ochre scarf, layered rust and olive traveling coat, loose cream trousers and leather boots, a shoulder satchel with books, holding an open pocket notebook in one hand. A few windblown maple leaves follow the coat. Welcoming, thoughtful pose, slight three-quarter view. Entire figure including boots comfortably inside the image.

Composition: tall portrait, character occupies central 75% of image height, clear sculptural silhouette, generous uncluttered margin. Warm ivory parchment background matching #e9e3d2 with subtle paper fibers. One large flat diagonal burnt-orange brushstroke panel behind the figure, faint graphite study of a maple leaf off to one side. Art-direction sheet feeling, but ONLY ONE finished character, no duplicate faces, no extra character panels.

Lighting: gentle warm directional light, confident deep ink shadows, delicate detailed face and hands.

No typography, no lettering, no logos, no watermark, no interface or borders. This art must hold up as a large web illustration and a cropped card portrait.

### Autumn scholar

Use case: stylized-concept. Asset type: companion character illustration for the same language-learning website art collection.

The attached image is a STYLE REFERENCE only. Create a different original character in the same ink-contour and painterly gouache fantasy concept-art style, cream parchment, autumn rust, mustard and dark olive, expressive semi-realistic adult proportions, beautifully detailed fabric and natural face.

Subject: one adult Japanese woman, a curious traveling scholar, full body, shoulder-length dark hair tied loosely with a rust ribbon, an olive layered travel coat over an ivory blouse and flowing ochre skirt, practical boots, small satchel, holding a closed book against her side and a pencil in her other hand. Warm, confident, thoughtful expression. No weapon. Entire figure and both boots visible with margins.

Tall portrait composition. Pale warm cream parchment background #e9e3d2, a subtle diagonal olive painted panel behind her, a faint graphite botanical leaf sketch off to one side. This is a finished single-character illustration, not multiple studies. Match the reference's rich brush textures and elegant angular silhouette. Not anime, not photorealistic, not a 3D render.

No text, no logo, no watermark, no border, no other people.

## Modular character portraits

The landing illustrations remain as editorial artwork. Interactive characters now use the raster-only modular portrait system documented in [MODULAR_PORTRAITS.md](MODULAR_PORTRAITS.md): 28 separately generated transparent PNG layers, common landmarks, interchangeable features, color controls and expression states. `CharacterRenderer` is the shared presentation boundary for these portraits.

Built-in imagegen prompts for the master reference and each part are recorded in [portrait-generation-prompts.json](portrait-generation-prompts.json). The old SVG person and geometric Three.js preview are removed. Existing equipment records are retained; the new creator saves portrait identity separately.

### Facial balance

The latest frontal reference guides proportions only. Keep the existing angular painted surfaces, strong jaw, head silhouette and hair. The shared [facial rig](FACIAL_RIG.md) now uses a smaller, shallower eye envelope, softer outer corners and a lower upper lid over the round iris. Brows sit closer to the eyes. The existing nose layer is widened 15% around its center; the mouth is slightly wider and sits 11 template pixels higher to shorten the mid-face. No replacement character or flattened portrait is introduced. Both earlier saved mesh-preset versions migrate to the adjusted part dimensions.
