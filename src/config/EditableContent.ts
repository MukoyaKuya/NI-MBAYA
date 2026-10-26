import Phaser from 'phaser';

export type GameContent = { version: 1; overrides: Record<string, string> };

const PREVIEW_KEY = 'ni-mbaya-content-preview';
const SEEN_KEY = 'ni-mbaya-content-seen';
let overrides: Record<string, string> = {};
let seen: Set<string> | undefined;

function validContent(value: unknown): value is GameContent {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<GameContent>;
  return data.version === 1 && !!data.overrides && typeof data.overrides === 'object' &&
    !Array.isArray(data.overrides) && Object.entries(data.overrides).every(([key, text]) =>
      key.length > 0 && key.length <= 500 && typeof text === 'string' && text.length <= 2000);
}

export async function loadEditableContent() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('contentPreview') === '1') {
      try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { seen = new Set(); }
      const preview = JSON.parse(localStorage.getItem(PREVIEW_KEY) || 'null');
      if (validContent(preview)) { overrides = preview.overrides; return; }
    }
    const response = await fetch(`${import.meta.env.BASE_URL}content/game-copy.json`, {
      cache: 'no-store', signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return;
    const content: unknown = await response.json();
    if (validContent(content)) overrides = content.overrides;
  } catch {
    // An offline or invalid content file must never keep the game from starting.
  }
}

export function editableCopy(text: string): string {
  if (seen && /[A-Za-zÀ-ÿ]/.test(text) && text.length > 2 && text.length <= 500 && !seen.has(text) && seen.size < 600) {
    seen.add(text);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* optional inspection */ }
  }
  return Object.prototype.hasOwnProperty.call(overrides, text) ? overrides[text] : text;
}

export function installEditableText() {
  const original = Phaser.GameObjects.Text.prototype.setText;
  Phaser.GameObjects.Text.prototype.setText = function (value: string | string[]) {
    if (value == null) return original.call(this, value);
    const source = Array.isArray(value) ? value.map(line => editableCopy(String(line))) : editableCopy(String(value));
    return original.call(this, source);
  };
}

export function installEditableDomText() {
  const replaceNode = (node: Node) => {
    if (node.nodeType !== Node.TEXT_NODE || node.parentElement?.closest('script, style, noscript')) return;
    const source = node.textContent || '';
    const trimmed = source.trim();
    if (!trimmed) return;
    const replacement = editableCopy(trimmed);
    if (replacement !== trimmed) node.textContent = source.replace(trimmed, replacement);
  };
  const scan = (root: Node) => {
    replaceNode(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) replaceNode(walker.currentNode);
  };
  scan(document.body);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') replaceNode(record.target);
      else record.addedNodes.forEach(scan);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
}
