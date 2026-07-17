export type ControlAction = 'left' | 'right' | 'up' | 'down' | 'jump' | 'punch' | 'kick' | 'special';

export const CONTROL_ACTIONS: ControlAction[] = ['left', 'right', 'up', 'down', 'jump', 'punch', 'kick', 'special'];

export const CONTROL_LABELS: Record<ControlAction, string> = {
  left: 'Move Left',
  right: 'Move Right',
  up: 'Move Up',
  down: 'Move Down',
  jump: 'Jump',
  punch: 'Punch',
  kick: 'Kick',
  special: 'Special',
};

export const DEFAULT_CONTROL_KEYS: Record<ControlAction, string> = {
  left: 'A',
  right: 'D',
  up: 'W',
  down: 'S',
  jump: 'SPACE',
  punch: 'J',
  kick: 'K',
  special: 'L',
};

const STORAGE_KEY = 'ni-mbaya-controls';

export function normalizeKeyName(event: KeyboardEvent) {
  if (event.code === 'Space' || event.key === ' ') return 'SPACE';
  if (event.code.startsWith('Key')) return event.code.slice(3).toUpperCase();
  if (event.code.startsWith('Digit')) return event.code.slice(5);
  if (event.code.startsWith('Numpad')) return 'NUMPAD_' + event.code.slice(6).toUpperCase();
  if (event.key.startsWith('Arrow')) return event.key.replace('Arrow', '').toUpperCase();
  return event.key.toUpperCase();
}

export function formatKeyName(key: string) {
  if (key === 'SPACE') return 'SPACE';
  if (key.startsWith('NUMPAD_')) return key.replace('NUMPAD_', 'NUM ');
  return key;
}

export function getControlKeys(): Record<ControlAction, string> {
  const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (!stored) return { ...DEFAULT_CONTROL_KEYS };

  try {
    const parsed = JSON.parse(stored) as Partial<Record<ControlAction, string>>;
    return CONTROL_ACTIONS.reduce<Record<ControlAction, string>>((keys, action) => {
      keys[action] = typeof parsed[action] === 'string' && parsed[action]
        ? parsed[action]
        : DEFAULT_CONTROL_KEYS[action];
      return keys;
    }, { ...DEFAULT_CONTROL_KEYS });
  } catch {
    return { ...DEFAULT_CONTROL_KEYS };
  }
}

export function setControlKey(action: ControlAction, key: string) {
  const keys = getControlKeys();
  keys[action] = key;
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(keys));
  return keys;
}

export function resetControlKeys() {
  globalThis.localStorage?.removeItem(STORAGE_KEY);
  return getControlKeys();
}

export const CONTROL_KEYS = DEFAULT_CONTROL_KEYS;

export type AttackKind = 'punch' | 'kick' | 'special';

export const ATTACK_DATA: Record<AttackKind, { damage: number; range: number; knockback: number; cooldown: number }> = {
  punch: { damage: 12, range: 72, knockback: 260, cooldown: 260 },
  kick: { damage: 18, range: 88, knockback: 340, cooldown: 420 },
  special: { damage: 32, range: 124, knockback: 520, cooldown: 900 },
};