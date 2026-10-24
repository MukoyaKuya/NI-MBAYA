import Phaser from 'phaser';

const SCREEN_NAMES: Record<string, string> = {
  MainMenuScene: 'BACK TO NAIROBI', CharacterSelectScene: 'CHOOSE YOUR FIGHTER',
  StoryCutsceneScene: 'THE STORY CONTINUES', HowToPlayScene: 'GET READY TO FIGHT',
  LevelScene: 'PREPARING THE STREETS', OptionsScene: 'GAME SETTINGS',
  CultureScene: 'EXPLORE NAIROBI', StoryCollectionScene: 'YOUR JOURNEY',
  AchievementsScene: 'YOUR ACHIEVEMENTS', DailyChallengeScene: 'DAILY CHALLENGE',
  ExitScene: 'SEE YOU IN THE STREETS',
};

/** Independent of the canvas: stays animated during scene asset downloads. */
export class SceneLoadingPlugin extends Phaser.Plugins.ScenePlugin {
  private overlay?: HTMLDivElement;
  private progress?: HTMLParagraphElement;
  private shownAt = 0;
  private hideTimer?: number;

  boot() {
    const events = this.systems!.events;
    events.on(Phaser.Scenes.Events.START, this.show, this);
    events.on(Phaser.Scenes.Events.SHUTDOWN, this.clear, this);
    events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  private show() {
    this.clear();
    const scene = this.scene!;
    if (scene.sys.settings.key === 'BootScene') return; // The initial brand intro owns boot.
    const overlay = document.createElement('div');
    overlay.id = 'scene-loading-overlay';
    overlay.className = 'scene-loading';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', 'Loading next screen');
    const card = document.createElement('div');
    card.className = 'scene-loading__card';
    const brand = document.createElement('strong');
    brand.textContent = 'NI MBAYA';
    brand.className = 'scene-loading__brand';
    const spinner = document.createElement('div');
    spinner.className = 'scene-loading__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('h2');
    heading.textContent = SCREEN_NAMES[scene.sys.settings.key] ?? 'GETTING READY';
    this.progress = document.createElement('p');
    this.progress.textContent = 'Getting things ready…';
    card.append(brand, spinner, heading, this.progress);
    overlay.append(card);
    (document.getElementById('game') ?? document.body).append(overlay);
    this.overlay = overlay;
    this.shownAt = performance.now();
    scene.load.on(Phaser.Loader.Events.PROGRESS, this.updateProgress, this);
    // CREATE alone is too early: wait until the destination has drawn its first frame.
    scene.events.once(Phaser.Scenes.Events.CREATE, this.created, this);
  }

  private updateProgress(value: number) {
    if (this.progress) this.progress.textContent = `Loading · ${Math.round(value * 100)}%`;
  }

  private created() {
    this.scene!.events.once(Phaser.Scenes.Events.RENDER, this.rendered, this);
  }

  private rendered() {
    // Background animation/audio loads must never reopen or prolong the overlay.
    this.scene!.load.off(Phaser.Loader.Events.PROGRESS, this.updateProgress, this);
    if (this.progress) this.progress.textContent = 'Ready. Twende!';
    this.hideTimer = window.setTimeout(() => this.clear(), Math.max(0, 240 - (performance.now() - this.shownAt)));
  }

  private clear() {
    if (this.hideTimer !== undefined) window.clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
    this.scene?.load.off(Phaser.Loader.Events.PROGRESS, this.updateProgress, this);
    this.systems?.events.off(Phaser.Scenes.Events.CREATE, this.created, this);
    this.systems?.events.off(Phaser.Scenes.Events.RENDER, this.rendered, this);
    this.overlay?.remove();
    this.overlay = undefined;
    this.progress = undefined;
  }

  destroy() {
    this.clear();
    this.systems?.events.off(Phaser.Scenes.Events.START, this.show, this);
    this.systems?.events.off(Phaser.Scenes.Events.SHUTDOWN, this.clear, this);
    super.destroy();
  }
}
