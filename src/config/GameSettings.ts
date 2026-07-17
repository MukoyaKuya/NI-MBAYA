export type Difficulty = 'easy' | 'normal' | 'hard';
export type StoryLanguage = 'en' | 'sw';

export type DifficultySettings = {
  label: string;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  enemyAttackCooldownMultiplier: number;
};

export const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  easy: { label: 'Easy', enemyHealthMultiplier: 0.8, enemyDamageMultiplier: 0.75, enemySpeedMultiplier: 0.9, enemyAttackCooldownMultiplier: 1.25 },
  normal: { label: 'Normal', enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemySpeedMultiplier: 1, enemyAttackCooldownMultiplier: 1 },
  hard: { label: 'Hard', enemyHealthMultiplier: 1.25, enemyDamageMultiplier: 1.35, enemySpeedMultiplier: 1.12, enemyAttackCooldownMultiplier: 0.78 },
};

const DIFFICULTY_STORAGE_KEY = 'ni-mbaya-difficulty';
const SOUND_STORAGE_KEY = 'ni-mbaya-sound-enabled';
const STORY_LANGUAGE_STORAGE_KEY = 'ni-mbaya-story-language';

export function getDifficulty(): Difficulty {
  const stored = globalThis.localStorage?.getItem(DIFFICULTY_STORAGE_KEY) as Difficulty | null;
  return stored && stored in DIFFICULTIES ? stored : 'normal';
}

export function getDifficultySettings() { return DIFFICULTIES[getDifficulty()]; }

export function cycleDifficulty(): Difficulty {
  const order: Difficulty[] = ['easy', 'normal', 'hard'];
  const next = order[(order.indexOf(getDifficulty()) + 1) % order.length];
  globalThis.localStorage?.setItem(DIFFICULTY_STORAGE_KEY, next);
  return next;
}

export function isSoundEnabled() { return globalThis.localStorage?.getItem(SOUND_STORAGE_KEY) !== 'false'; }
export function setSoundEnabled(enabled: boolean) { globalThis.localStorage?.setItem(SOUND_STORAGE_KEY, String(enabled)); return enabled; }
export function toggleSoundEnabled() { return setSoundEnabled(!isSoundEnabled()); }
export function getStoryLanguage(): StoryLanguage { return globalThis.localStorage?.getItem(STORY_LANGUAGE_STORAGE_KEY) === 'sw' ? 'sw' : 'en'; }
export function toggleStoryLanguage(): StoryLanguage {
  const next: StoryLanguage = getStoryLanguage() === 'en' ? 'sw' : 'en';
  globalThis.localStorage?.setItem(STORY_LANGUAGE_STORAGE_KEY, next);
  return next;
}