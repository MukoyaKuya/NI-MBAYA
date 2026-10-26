# NI MBAYA Content Studio

Open `/admin/` on the same host as the game. The dashboard lists the game's built-in text, including English and Swahili copy. Search or choose a section, then enter replacement text. An empty replacement restores the original.

## Review and publish

1. Select **Preview game**. The preview uses your local draft and records additional text it encounters under **Found in preview**. Play through the screens you want to inspect.
2. Return to the dashboard and review the draft. Use **Download JSON backup** before a large edit if you want an extra copy.
3. Create a fine-grained GitHub personal access token scoped to the `MukoyaKuya/NI-MBAYA` repository with **Contents: Read and write** permission. Paste it into the dashboard and select **Publish changes**. The dashboard commits only `public/content/game-copy.json` to `main`; the existing GitHub Pages workflow then deploys it. The token stays in the page's input and is cleared after a successful publish. It is never written to local storage.

The dashboard checks for a newer repository version before publishing. If someone else published first, reload and review their changes. A local draft is stored in this browser until it is published or discarded.

## What can be edited

The content file replaces Phaser canvas text and DOM text by exact original string. A phrase reused on several screens changes everywhere it appears. The three story paragraphs also support full paragraph replacements while retaining their original highlighted layout when unedited. Dynamic labels that are missing from the built-in list can be found by playing the preview, or added with **Add exact text**.

Text painted into WebP artwork, including some main-menu button labels, is part of the image. Those labels require replacing the artwork to change. Very long replacement text can outgrow a fixed game panel, so check it in the preview before publishing.

## Content format

`public/content/game-copy.json` is a UTF-8 file with this shape:

```json
{
  "version": 1,
  "overrides": {
    "HOW TO PLAY": "FIGHT GUIDE"
  }
}
```

The key must match the original displayed text exactly. Build the editor's text list after adding new game copy with `npm run content:catalog`.
