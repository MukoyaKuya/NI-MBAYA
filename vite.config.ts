import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // GitHub Pages serves this project from /NI-MBAYA/, while local Vite runs
  // from the site root.
  base: process.env.GITHUB_ACTIONS ? '/NI-MBAYA/' : '/',
  resolve: {
    alias: {
      // This game uses Arcade Physics exclusively, so avoid bundling Phaser's
      // unused Matter Physics engine and other full-build extras.
      phaser: fileURLToPath(
        new URL('./node_modules/phaser/dist/phaser-arcade-physics.js', import.meta.url),
      ),
    },
  },
  build: {
    // Cache the engine independently from the game's own code. A content-only
    // update then avoids forcing returning players to download Phaser again.
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
    // Phaser remains intentionally larger than Vite's generic 500 kB default.
    // Keep the limit close to the known engine bundle so unexpected growth is
    // still reported.
    chunkSizeWarningLimit: 1_200,
  },
  server: {
    port: 5173,
  },
});
