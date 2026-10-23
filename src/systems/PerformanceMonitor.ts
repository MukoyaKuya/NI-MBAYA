import type Phaser from 'phaser';
import { getStreamingMusicStatus } from './StreamingMusic';

const loads: { scene: string; startedMs: number; durationMs?: number; failed: string[] }[] = [];

export function trackAssetLoading(scene: Phaser.Scene, phase = scene.scene.key) {
  const entry = { scene: phase, startedMs: Math.round(performance.now()), failed: [] as string[], durationMs: undefined as number | undefined };
  loads.push(entry);
  if (loads.length > 30) loads.shift();
  const failed = (file: { key: string }) => entry.failed.push(file.key);
  scene.load.on('loaderror', failed);
  scene.load.once('complete', () => {
    entry.durationMs = Math.round(performance.now() - entry.startedMs);
    scene.load.off('loaderror', failed);
  });
}

/** Local diagnostics only: nothing is sent to a server. Press F8 or use ?perf=1. */
export function installPerformanceMonitor(game: Phaser.Game) {
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'Game performance');
  panel.style.cssText = 'position:fixed;right:12px;top:12px;z-index:3000;width:min(470px,90vw);max-height:85dvh;overflow:auto;padding:16px;box-sizing:border-box;background:#07111ff5;color:#fff;border:1px solid #ffc51d;border-radius:8px;font:13px/1.5 monospace';
  const title = document.createElement('strong');
  title.textContent = 'PERFORMANCE · LOCAL REPORT';
  const close = document.createElement('button');
  close.textContent = 'Close (F8)';
  close.style.cssText = 'float:right;cursor:pointer';
  const output = document.createElement('pre');
  output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere';
  const download = document.createElement('button');
  download.textContent = 'Download report';
  download.style.cssText = 'padding:8px;cursor:pointer';
  panel.append(title, close, output, download);
  let visible = new URLSearchParams(location.search).get('perf') === '1';
  let longTasks = 0, longestTaskMs = 0;
  let observer: PerformanceObserver | undefined;
  if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
    observer = new PerformanceObserver(list => {
      for (const task of list.getEntries()) {
        if (document.hidden) continue;
        longTasks++;
        longestTaskMs = Math.max(longestTaskMs, task.duration);
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  }
  const report = () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      capturedAt: new Date().toISOString(),
      visibility: document.visibilityState,
      music: getStreamingMusicStatus(),
      fps: document.hidden ? null : Math.round(game.loop.actualFps || 0),
      longTasks, longestTaskMs: Math.round(longestTaskMs),
      milestones: performance.getEntriesByType('mark').filter(mark => mark.name.startsWith('ni-mbaya:')).map(mark => ({ name: mark.name, sinceNavigationMs: Math.round(mark.startTime) })),
      loads,
      slowestRequests: resources.filter(resource => resource.name.startsWith(location.origin)).sort((a, b) => b.duration - a.duration).slice(0, 10).map(resource => ({
        file: new URL(resource.name).pathname.split('/').pop(),
        initiator: resource.initiatorType,
        durationMs: Math.round(resource.duration),
        waitMs: Math.round(resource.responseStart - resource.requestStart),
        downloadMs: Math.round(resource.responseEnd - resource.responseStart),
        transferBytes: resource.transferSize,
      })),
    };
  };
  const render = () => {
    if (!visible) return;
    const data = report();
    output.textContent = `FPS: ${data.fps ?? 'paused (tab hidden)'}\nLong tasks (>50ms): ${longTasks}\nLongest task: ${data.longestTaskMs}ms\nMusic: ${data.music.track ?? 'none'} · ${'playing' in data.music && data.music.playing ? 'playing' : 'paused/loading'}${'error' in data.music && data.music.error ? ' · ' + data.music.error : ''}\n\nREADY TIMES (since page opened)\n`
      + data.milestones.map(mark => `${mark.name.replace('ni-mbaya:', '')}: ${(mark.sinceNavigationMs / 1000).toFixed(1)}s`).join('\n')
      + '\n\nASSET LOADS\n' + loads.map(load => `${load.scene}: ${load.durationMs === undefined ? 'loading…' : (load.durationMs / 1000).toFixed(1) + 's'}${load.failed.length ? ' FAILED: ' + load.failed.join(', ') : ''}`).join('\n')
      + '\n\nSLOWEST REQUESTS\n' + data.slowestRequests.map(resource => `${(resource.durationMs / 1000).toFixed(1)}s · ${resource.file}\n  ${resource.initiator} / ${(resource.transferBytes / 1024).toFixed(0)} KB transferred\n  wait ${resource.waitMs}ms / download ${resource.downloadMs}ms`).join('\n')
      + '\n\nNo data is uploaded. Download this report to share it.';
  };
  const attach = () => { if (visible) (document.fullscreenElement ?? document.body).append(panel); };
  const toggle = () => { visible = !visible; if (visible) { attach(); render(); } else panel.remove(); };
  close.onclick = toggle;
  const keydown = (event: KeyboardEvent) => {
    if (event.code === 'F8') { event.preventDefault(); toggle(); }
  };
  window.addEventListener('keydown', keydown);
  document.addEventListener('fullscreenchange', attach);
  download.onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ni-mbaya-performance.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (visible) { attach(); render(); }
  const timer = window.setInterval(render, 1000);
  game.events.once('destroy', () => { clearInterval(timer); observer?.disconnect(); panel.remove(); window.removeEventListener('keydown', keydown); document.removeEventListener('fullscreenchange', attach); });
}
