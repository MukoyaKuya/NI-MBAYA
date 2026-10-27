import { readStorage, writeStorage, removeStorage } from './Storage';

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
  left: 'LEFT',
  right: 'RIGHT',
  up: 'UP',
  down: 'DOWN',
  jump: 'SPACE',
  punch: 'J',
  kick: 'K',
  special: 'L',
};

const STORAGE_KEY = 'ni-mbaya-controls';
const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const CODE_KEYS: Record<string, string> = {
  Escape: 'ESC', Space: 'SPACE', Enter: 'ENTER', Tab: 'TAB', Backspace: 'BACKSPACE',
  ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ControlLeft: 'CTRL', ControlRight: 'CTRL',
  AltLeft: 'ALT', AltRight: 'ALT',
  Semicolon: 'SEMICOLON', Equal: 'PLUS', Comma: 'COMMA', Minus: 'MINUS', Period: 'PERIOD',
  Slash: 'FORWARD_SLASH', Backslash: 'BACK_SLASH', Quote: 'QUOTES', Backquote: 'BACKTICK',
  BracketLeft: 'OPEN_BRACKET', BracketRight: 'CLOSED_BRACKET',
  NumpadAdd: 'NUMPAD_ADD', NumpadSubtract: 'NUMPAD_SUBTRACT',
  PageUp: 'PAGE_UP', PageDown: 'PAGE_DOWN',
};
const SUPPORTED_KEYS = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...DIGITS, ...DIGITS.map(key => `NUMPAD_${key}`),
  ...Object.values(CODE_KEYS), 'LEFT', 'RIGHT', 'UP', 'DOWN',
  'HOME', 'END', 'PAGE_UP', 'PAGE_DOWN', 'INSERT', 'DELETE',
]);

function canonicalKey(key: string) {
  const upper = key.toUpperCase();
  if (/^\d$/.test(upper)) return DIGITS[Number(upper)];
  if (/^NUMPAD_\d$/.test(upper)) return `NUMPAD_${DIGITS[Number(upper.slice(-1))]}`;
  return upper;
}

function keyError(key: string): string | null {
  if (key === 'P' || key === 'ESC') return 'KEY RESERVED FOR PAUSE';
  if (key === 'F8') return 'KEY RESERVED FOR PERFORMANCE REPORT';
  return SUPPORTED_KEYS.has(key) ? null : 'UNSUPPORTED KEY — CHOOSE ANOTHER';
}

export function getControlKeyError(action: ControlAction, key: string): string | null {
  key = canonicalKey(key);
  const error = keyError(key);
  if (error) return error;
  const keys = getControlKeys();
  const conflict = CONTROL_ACTIONS.find(other => other !== action && keys[other] === key);
  return conflict ? `KEY ALREADY USED FOR ${CONTROL_LABELS[conflict].toUpperCase()}` : null;
}

export function normalizeKeyName(event: KeyboardEvent) {
  if (event.code === 'Space' || event.key === ' ') return 'SPACE';
  if (event.code.startsWith('Key')) return event.code.slice(3).toUpperCase();
  if (/^Digit\d$/.test(event.code)) return DIGITS[Number(event.code.slice(5))];
  if (/^Numpad\d$/.test(event.code)) return 'NUMPAD_' + DIGITS[Number(event.code.slice(6))];
  if (Object.prototype.hasOwnProperty.call(CODE_KEYS, event.code)) return CODE_KEYS[event.code];
  if (event.key.startsWith('Arrow')) return event.key.replace('Arrow', '').toUpperCase();
  return event.key.toUpperCase();
}

export function formatKeyName(key: string): string {
  if (key === 'SPACE') return 'SPACE';
  if (DIGITS.includes(key)) return String(DIGITS.indexOf(key));
  if (key.startsWith('NUMPAD_')) return 'NUM ' + formatKeyName(key.slice(7));
  return key;
}

export function getControlKeys(): Record<ControlAction, string> {
  const stored = readStorage(STORAGE_KEY);
  if (!stored) return { ...DEFAULT_CONTROL_KEYS };

  try {
    const parsed = JSON.parse(stored) as Partial<Record<ControlAction, string>>;
    // Move prior untouched defaults to the new arrow-key layout while
    // preserving any player who deliberately remapped their controls.
    if (parsed.left === 'A' && parsed.right === 'D' && parsed.up === 'W' && parsed.down === 'S') {
      parsed.left = 'LEFT';
      parsed.right = 'RIGHT';
      parsed.up = 'UP';
      parsed.down = 'DOWN';
      writeStorage(STORAGE_KEY, JSON.stringify(parsed));
    }
    const keys = {} as Record<ControlAction, string>;
    const used = new Set<string>();
    // Retain valid saved bindings first, then repair missing/conflicting ones.
    for (const action of CONTROL_ACTIONS) {
      const key = typeof parsed[action] === 'string' ? canonicalKey(parsed[action]!) : '';
      if (keyError(key) || used.has(key)) continue;
      keys[action] = key;
      used.add(key);
    }
    for (const action of CONTROL_ACTIONS) {
      if (keys[action]) continue;
      const key = [DEFAULT_CONTROL_KEYS[action], ...Object.values(DEFAULT_CONTROL_KEYS), ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
        .find(candidate => !used.has(candidate) && !keyError(candidate))!;
      keys[action] = key;
      used.add(key);
    }
    return keys;
  } catch {
    return { ...DEFAULT_CONTROL_KEYS };
  }
}

export function setControlKey(action: ControlAction, key: string) {
  const keys = getControlKeys();
  key = canonicalKey(key);
  if (getControlKeyError(action, key)) return keys;
  keys[action] = key;
  writeStorage(STORAGE_KEY, JSON.stringify(keys));
  return keys;
}

export function resetControlKeys() {
  removeStorage(STORAGE_KEY);
  return getControlKeys();
}

export const CONTROL_KEYS = DEFAULT_CONTROL_KEYS;

export type AttackKind = 'punch' | 'kick' | 'special';

export const ATTACK_DATA: Record<AttackKind, { damage: number; range: number; knockback: number; cooldown: number }> = {
  punch: { damage: 12, range: 72, knockback: 260, cooldown: 260 },
  kick: { damage: 18, range: 88, knockback: 340, cooldown: 420 },
  special: { damage: 32, range: 124, knockback: 520, cooldown: 900 },
};
