import type Phaser from 'phaser';
import { SPRITE_FRAGMENT_RUNS } from './SpriteFragmentRuns';

const RUN_SHEETS = new Set([
  'gameplay-goon-red-run-sheet', 'gameplay-goon-hoodie-run-sheet',
  'gameplay-goon-club-run-sheet', 'gameplay-kibera-stone-goon-sprint-sheet',
  'gameplay-kibera-shield-goon-sprint-sheet',
]);

/** Keep the connected character, excluding detached pieces even inside its bounds. */
export function removeDetachedPixels(data: Uint8ClampedArray, width: number, height: number) {
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(width * height);
  let label = 0, largest = 0, largestSize = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] < 16) continue;
    label++;
    let head = 0, tail = 1;
    queue[0] = start;
    labels[start] = label;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width, y = Math.floor(pixel / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (!labels[next] && data[next * 4 + 3] >= 16) {
            labels[next] = label;
            queue[tail++] = next;
          }
        }
      }
    }
    if (tail > largestSize) { largestSize = tail; largest = label; }
  }
  if (!largest) return;
  for (let pixel = 0; pixel < labels.length; pixel++) {
    if (!data[pixel * 4 + 3] || labels[pixel] === largest) continue;
    // Preserve the runner's soft antialiased edge, without retaining isolated
    // bits of other poses. Never shrink or reposition the animation frame.
    const x = pixel % width, y = Math.floor(pixel / width);
    let nearRunner = false;
    for (let dy = -2; dy <= 2 && !nearRunner; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && labels[ny * width + nx] === largest) {
          nearRunner = true;
          break;
        }
      }
    }
    if (!nearRunner) data[pixel * 4 + 3] = 0;
  }
}

/** Build once per loaded sheet, before either direction of the run is played. */
export function getCleanEnemyRunTexture(textures: Phaser.Textures.TextureManager, key: string) {
  if (!RUN_SHEETS.has(key)) return key;
  return getCleanSheet(textures, key, 384, 384);
}

export function getCleanPlayerFallTexture(textures: Phaser.Textures.TextureManager) {
  return getCleanSheet(textures, 'gameplay-mbavu-defeat-fall-sheet', 512, 384);
}

export function getCleanChapatiTexture(textures: Phaser.Textures.TextureManager) {
  return getCleanSheet(textures, 'gameplay-chapati-health-pickup-sheet', 384, 384);
}

function getCleanSheet(textures: Phaser.Textures.TextureManager, key: string, frameWidth: number, frameHeight: number) {
  const cleanKey = `${key}-clean`;
  if (textures.exists(cleanKey)) return cleanKey;
  const source = textures.get(key).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return key;
  context.drawImage(source, 0, 0);
  const spans = SPRITE_FRAGMENT_RUNS[key];
  if (spans) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let span = 0; span < spans.length; span += 2) {
      const end = spans[span] + spans[span + 1];
      for (let pixel = spans[span]; pixel < end; pixel++) pixels.data[pixel * 4 + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
  } else {
    for (let x = 0; x < canvas.width; x += frameWidth) {
      const frame = context.getImageData(x, 0, frameWidth, frameHeight);
      removeDetachedPixels(frame.data, frameWidth, frameHeight);
      context.putImageData(frame, x, 0);
    }
  }
  const texture = textures.addCanvas(cleanKey, canvas);
  if (!texture) return key;
  textures.addSpriteSheet(cleanKey, texture, { frameWidth, frameHeight });
  return cleanKey;
}
