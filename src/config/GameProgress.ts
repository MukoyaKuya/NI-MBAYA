const UNLOCKED_STORIES_KEY = 'ni-mbaya-unlocked-stories';
const JOURNEY_SAVE_KEY = 'ni-mbaya-journey-save';

export type JourneySave = {
  levelId: number;
  character: string;
  chapatis: number;
  health: number;
};

function readUnlockedStories() {
  try {
    const stored = JSON.parse(globalThis.localStorage?.getItem(UNLOCKED_STORIES_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id): id is number => Number.isInteger(id)) : [];
  } catch { return []; }
}

export function getUnlockedStoryIds() { return readUnlockedStories(); }
export function unlockLocationStory(levelId: number) {
  const unlocked = readUnlockedStories();
  if (unlocked.includes(levelId)) return false;
  globalThis.localStorage?.setItem(UNLOCKED_STORIES_KEY, JSON.stringify([...unlocked, levelId]));
  return true;
}

export function getJourneySave(): JourneySave | null {
  try {
    const save = JSON.parse(globalThis.localStorage?.getItem(JOURNEY_SAVE_KEY) ?? 'null') as Partial<JourneySave> | null;
    if (!save || !Number.isInteger(save.levelId) || save.levelId! < 1 || save.levelId! > 4 || typeof save.character !== 'string') return null;
    return {
      levelId: save.levelId!,
      character: save.character,
      chapatis: Math.max(0, Number(save.chapatis) || 0),
      // Keep this persistence helper independent from Phaser so Continue
      // works even before a scene has created its game objects.
      health: Math.max(1, Math.min(100, Number(save.health) || 100)),
    };
  } catch { return null; }
}

export function saveJourneyProgress(save: JourneySave) {
  globalThis.localStorage?.setItem(JOURNEY_SAVE_KEY, JSON.stringify(save));
}
