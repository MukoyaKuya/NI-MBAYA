export type PlayerArtSpec = {
  key: string;
  width: number;
  height: number;
  yOffset: number;
  xOffset: number;
};

export const PLAYER_ART: Record<string, PlayerArtSpec> = {
  idle: { key: 'gameplay-mbavu-idle', width: 168, height: 252, yOffset: 68, xOffset: 0 },
  walk: { key: 'gameplay-mbavu-run-sheet', width: 190, height: 285, yOffset: 84, xOffset: 4 },
  punch: { key: 'gameplay-mbavu-punch', width: 205, height: 286, yOffset: 82, xOffset: 22 },
  kick: { key: 'gameplay-mbavu-standing-kick', width: 205, height: 286, yOffset: 82, xOffset: 30 },
  special: { key: 'gameplay-mbavu-kick', width: 365, height: 244, yOffset: 120, xOffset: 58 },
  jump: { key: 'gameplay-mbavu-kick', width: 315, height: 210, yOffset: 130, xOffset: 30 },
  hit: { key: 'gameplay-mbavu-idle', width: 168, height: 252, yOffset: 68, xOffset: -10 },
  defeat: { key: 'gameplay-mbavu-defeat', width: 260, height: 174, yOffset: 36, xOffset: 0 },
};

export const PLAYER_DEFEAT_FALL_DISPLAY = { width: 360, height: 270, yOffset: 70 };
export const MJAKA_ART: Record<string, PlayerArtSpec> = {
  idle: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
  walk: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
  punch: { key: 'gameplay-mjaka-palm-strike', width: 214, height: 267, yOffset: 78, xOffset: 24 },
  kick: { key: 'gameplay-mjaka-high-kick', width: 250, height: 267, yOffset: 78, xOffset: 42 },
  special: { key: 'gameplay-mjaka-rush-kick', width: 330, height: 233, yOffset: 108, xOffset: 58 },
  jump: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 92, xOffset: 0 },
  hit: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: -8 },
  defeat: { key: 'menu-mjaka', width: 176, height: 276, yOffset: 82, xOffset: 0 },
};

export const PLAYER_FEINT_FRAMES: PlayerArtSpec[] = [
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-idle', xOffset: 0, width: 168, height: 252, yOffset: 68 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-1', xOffset: -2, width: 170, height: 250, yOffset: 67 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-2', xOffset: 2, width: 166, height: 256, yOffset: 70 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-3', xOffset: -4, width: 172, height: 248, yOffset: 66 },
  { ...PLAYER_ART.idle, key: 'gameplay-mbavu-feint-4', xOffset: 1, width: 168, height: 254, yOffset: 69 },
];
