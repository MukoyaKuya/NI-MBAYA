export type ArcadeFighterId = 'majembe' | 'mbavu';

export const ARCADE_FIGHTERS = {
  majembe: {
    name: 'MAJEMBE', role: 'STREET FIGHTER', texture: 'arcade-majembe',
    image: new URL('../assets/optimized/menu/generated/mbavu.webp', import.meta.url).href,
    punchTexture: 'arcade-majembe-punch',
    punchImage: new URL('../assets/optimized/gameplay/generated/mbavu-punch.webp', import.meta.url).href,
    kickTexture: 'arcade-majembe-kick',
    kickImage: new URL('../assets/optimized/gameplay/generated/mbavu-kick.webp', import.meta.url).href,
    portrait: [174, 38, 568, 336] as const, power: 4, speed: 4,
  },
  mbavu: {
    name: 'MBAVU', role: 'DESTROYER', texture: 'arcade-mbavu',
    image: new URL('../assets/optimized/menu/generated/majembe.webp', import.meta.url).href,
    punchTexture: 'arcade-mbavu-punch',
    punchImage: new URL('../assets/optimized/arcade/mbavu-punch.webp', import.meta.url).href,
    kickTexture: 'arcade-mbavu-kick',
    kickImage: new URL('../assets/optimized/arcade/mbavu-kick.webp', import.meta.url).href,
    portrait: [235, 10, 614, 364] as const, power: 5, speed: 3,
  },
} as const;

export const ARCADE_FIGHTER_IDS: ArcadeFighterId[] = ['majembe', 'mbavu'];
