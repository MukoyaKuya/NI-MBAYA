import { getUnlockedStoryIds } from './GameProgress';
import type { LocalizedCopy } from './WorldContent';

export type Achievement = {
  id: string;
  title: LocalizedCopy;
  description: LocalizedCopy;
  progress: number;
  target: number;
  unlocked: boolean;
};

const locations = [
  { id: 'cbd', title: { en: 'CBD SURVIVOR', sw: 'SHUJAA WA CBD' }, description: { en: 'Clear Level 1 · Nairobi CBD', sw: 'Maliza Kiwango 1 · Nairobi CBD' } },
  { id: 'backstreet', title: { en: 'BACKSTREET FIGHTER', sw: 'MPIGANAJI WA MITAA' }, description: { en: 'Clear Level 2 · Downtown Backstreet', sw: 'Maliza Kiwango 2 · Downtown Backstreet' } },
  { id: 'rooftops', title: { en: 'ABOVE THE CITY', sw: 'JUU YA JIJI' }, description: { en: 'Clear Level 3 · Nairobi Rooftops', sw: 'Maliza Kiwango 3 · Nairobi Rooftops' } },
  { id: 'kibera', title: { en: 'KIBERA VICTORY', sw: 'USHINDI WA KIBERA' }, description: { en: 'Clear Level 4 · Kibera', sw: 'Maliza Kiwango 4 · Kibera' } },
];

/** Derive badges from real level clears, including journeys saved before this screen existed. */
export function getAchievements(levelIds = getUnlockedStoryIds()): Achievement[] {
  const cleared = new Set(levelIds.filter(id => Number.isInteger(id) && id >= 1 && id <= 4));
  return [
    ...locations.map((location, index) => ({
      ...location, progress: cleared.has(index + 1) ? 1 : 0, target: 1, unlocked: cleared.has(index + 1),
    })),
    {
      id: 'city-champion', title: { en: 'CITY CHAMPION', sw: 'BINGWA WA JIJI' },
      description: { en: 'Clear all four locations. Make Nairobi your story.', sw: 'Maliza maeneo yote manne. Andika hadithi yako Nairobi.' },
      progress: cleared.size, target: 4, unlocked: cleared.size === 4,
    },
  ];
}
