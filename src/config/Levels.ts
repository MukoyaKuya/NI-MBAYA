import type { EnemyVisualVariant } from '../entities/EnemyGoon';

type EnemySpawn = {
  x: number;
  offset: number;
  variant: EnemyVisualVariant;
  speed: number;
};

export type LevelDefinition = {
  id: number;
  title: string;
  location: string;
  backgroundKey: string;
  reward: number;
  enemies: EnemySpawn[];
};

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: 'LEVEL 1',
    location: 'NAIROBI CBD',
    backgroundKey: 'nairobi-cbd-background',
    reward: 250,
    enemies: [
      { x: 210, offset: -315, variant: 'gameplay-goon-hoodie', speed: 118 },
      { x: 355, offset: -190, variant: 'gameplay-goon-club', speed: 126 },
      { x: 820, offset: 175, variant: 'gameplay-goon', speed: 132 },
      { x: 1000, offset: 305, variant: 'gameplay-goon-club', speed: 122 },
      { x: 1140, offset: 430, variant: 'gameplay-goon-hoodie', speed: 112 },
    ],
  },
  {
    id: 2,
    title: 'LEVEL 2',
    location: 'DOWNTOWN BACKSTREET',
    backgroundKey: 'gameplay-background',
    reward: 400,
    enemies: [
      { x: 180, offset: -350, variant: 'gameplay-goon', speed: 136 },
      { x: 310, offset: -245, variant: 'gameplay-goon-hoodie', speed: 128 },
      { x: 465, offset: -135, variant: 'gameplay-goon-club', speed: 132 },
      { x: 900, offset: 160, variant: 'gameplay-goon', speed: 142 },
      { x: 1060, offset: 285, variant: 'gameplay-goon-club', speed: 136 },
      { x: 1190, offset: 415, variant: 'gameplay-goon-hoodie', speed: 126 },
    ],
  },
  {
    id: 3,
    title: 'LEVEL 3',
    location: 'NAIROBI ROOFTOPS',
    backgroundKey: 'level3-nairobi-rooftop-background',
    reward: 650,
    enemies: [
      { x: 150, offset: -390, variant: 'gameplay-goon-chain', speed: 146 },
      { x: 320, offset: -250, variant: 'gameplay-attack-dog', speed: 176 },
      { x: 485, offset: -120, variant: 'gameplay-goon-heavy', speed: 108 },
      { x: 870, offset: 155, variant: 'gameplay-goon-chain', speed: 150 },
      { x: 1040, offset: 300, variant: 'gameplay-attack-dog', speed: 180 },
      { x: 1190, offset: 440, variant: 'gameplay-goon-heavy', speed: 112 },
    ],
  },
  {
    id: 4,
    title: 'LEVEL 4',
    location: 'KIBERA',
    backgroundKey: 'level4-kibera-background',
    reward: 900,
    enemies: [
      { x: 150, offset: -410, variant: 'gameplay-kibera-stone-goon', speed: 132 },
      { x: 330, offset: -270, variant: 'gameplay-kibera-shield-goon', speed: 96 },
      { x: 500, offset: -125, variant: 'gameplay-kibera-stone-goon', speed: 138 },
      { x: 850, offset: 145, variant: 'gameplay-kibera-shield-goon', speed: 100 },
      { x: 1040, offset: 305, variant: 'gameplay-kibera-stone-goon', speed: 142 },
      { x: 1190, offset: 455, variant: 'gameplay-kibera-shield-goon', speed: 98 },
    ],
  },
];

export const getLevelDefinition = (levelId: number) => LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];
