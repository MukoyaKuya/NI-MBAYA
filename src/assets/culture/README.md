# World screen artwork

Generated using the built-in `image_gen.imagegen` tool from the user's first reference, `16fc1644-caa2-4d48-8180-3bb78088f6a7.png`.

- Editable source: `generated/world-background-v1.png`
- Runtime delivery copy: `../optimized/culture/generated/world-background-v1.webp` (quality 88, preserved dimensions)
- Consumer: `src/scenes/CultureScene.ts`, loaded only on entering the World screen.

The title, body copy, story counter, separators and buttons are drawn by Phaser. No UI copy is baked into the artwork; English and Swahili remain live.

## Final generation prompt

Use case: precise-object-edit. Create a production game UI background based very closely on this reference, adapted to landscape 16:9, 1920x1080. Preserve the cinematic illustrated Nairobi sunset, vivid orange and violet sky, wet street, original black male fighter on the far left and original black female fighter on the far right in purple trousers, and the partially visible rival at extreme right. Preserve their identities, fighting poses, dramatic lighting, painterly realism and high contrast. Frame the far-left and far-right fighters around a SINGLE large empty near-black grunge information panel with distressed gold border. In 1280x720 logical coordinates, that empty panel spans x214..1066, y112..594; keep the text-safe interior x280..1000 clear of characters. Keep a subtle dark gold crown motif in upper left of panel. IMPORTANT remove ALL interface typography from the panel: no title, subtitle, paragraphs, story count, labels, letters, digits or placeholder text in the central panel. Remove ALL three bottom buttons and labels entirely, leave the street behind them, the game will draw native gold buttons at y645. Do not add any other UI widgets or text. Environmental street signage may remain. Keep central panel mostly uniform charcoal-black with subtle gritty texture, to allow clear live white and gold text, no bright skyline inside the text region. Reference look and composition, clean empty panel, no watermark. Output 16:9 landscape.
