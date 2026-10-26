import './admin.css';

type Content = { version: 1; overrides: Record<string, string> };
type Catalog = { version: 1; sections: { name: string; entries: string[] }[] };

const DRAFT_KEY = 'ni-mbaya-content-draft';
const PREVIEW_KEY = 'ni-mbaya-content-preview';
const SEEN_KEY = 'ni-mbaya-content-seen';
const API = 'https://api.github.com/repos/MukoyaKuya/NI-MBAYA/contents/public/content/game-copy.json';
const CONTENT_URL = `${import.meta.env.BASE_URL}content/game-copy.json`;
const CATALOG_URL = `${import.meta.env.BASE_URL}content/catalog.json`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const state = {
  catalog: { version: 1, sections: [] } as Catalog,
  published: { version: 1, overrides: {} } as Content,
  draft: { version: 1, overrides: {} } as Content,
  section: 'All content',
  search: '',
  custom: new Set<string>(),
  visibleLimit: 24,
};

function isContent(input: unknown): input is Content {
  if (!input || typeof input !== 'object') return false;
  const value = input as Partial<Content>;
  return value.version === 1 && !!value.overrides && !Array.isArray(value.overrides) &&
    typeof value.overrides === 'object' && Object.entries(value.overrides).every(([key, text]) =>
      key.length > 0 && key.length <= 500 && typeof text === 'string' && text.length <= 2000);
}

function notify(message: string) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 5000);
}

function safeRead(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(state.draft));
  refreshSummary();
}

function allSections() {
  let seen: string[] = [];
  try {
    const value = safeRead(SEEN_KEY);
    if (Array.isArray(value)) seen = value.filter((item): item is string => typeof item === 'string' && item.length <= 500);
  } catch { /* Preview discoveries are optional. */ }
  const cataloged = new Set(state.catalog.sections.flatMap(section => section.entries));
  const discovered = seen.filter(text => !cataloged.has(text));
  const custom = [...state.custom].filter(text => !cataloged.has(text) && !discovered.includes(text));
  return [...state.catalog.sections, { name: 'Found in preview', entries: discovered }, { name: 'Custom text', entries: custom }];
}

function sectionEntries() {
  const sections = allSections();
  const chosen = state.section === 'All content' ? sections : sections.filter(section => section.name === state.section);
  const query = state.search.toLocaleLowerCase();
  return chosen.flatMap(section => section.entries.map(original => ({ section: section.name, original })))
    .filter(entry => !query || entry.original.toLocaleLowerCase().includes(query) ||
      (state.draft.overrides[entry.original] || '').toLocaleLowerCase().includes(query))
    .filter((entry, index, entries) => entries.findIndex(other => other.original === entry.original) === index);
}

function refreshSummary() {
  const count = Object.keys(state.draft.overrides).length;
  $('#edited-count').textContent = String(count).padStart(2, '0');
  const dirty = JSON.stringify(state.draft.overrides) !== JSON.stringify(state.published.overrides);
  const indicator = $('#save-indicator');
  indicator.textContent = dirty ? `${count} draft edit${count === 1 ? '' : 's'}` : 'All changes published';
  indicator.classList.toggle('dirty', dirty);
}

function renderNav() {
  const nav = $('#sections');
  nav.replaceChildren();
  const sections = allSections();
  const items = [{ name: 'All content', entries: sections.flatMap(section => section.entries) }, ...sections];
  $('#section-count').textContent = `${new Set(items[0].entries).size} fields`;
  for (const section of items) {
    if (section.entries.length === 0 && section.name !== 'Custom text') continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `section-button${state.section === section.name ? ' active' : ''}`;
    const label = document.createElement('span');
    label.textContent = section.name;
    const count = document.createElement('small');
    count.textContent = String(section.entries.length);
    button.append(label, count);
    button.addEventListener('click', () => { state.section = section.name; state.visibleLimit = 24; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    nav.append(button);
  }
}

function renderEntries() {
  const entries = sectionEntries();
  const container = $('#entries');
  container.replaceChildren();
  $('#crumb-section').textContent = state.section.toUpperCase();
  $('#section-title').textContent = state.search ? 'Search results' : state.section;
  $('#section-description').textContent = state.search
    ? `Showing matches for “${state.search}” across the game.`
    : state.section === 'All content' ? 'Select a section to focus on one screen or edit directly below.'
      : state.section === 'Found in preview' ? 'Text captured while you played the preview, including changing labels.'
        : 'Edit the copy players will see on this screen.';
  $('#result-count').textContent = `${entries.length} line${entries.length === 1 ? '' : 's'}`;
  $('#empty-state').hidden = entries.length > 0;

  const more = $('#load-more');
  more.hidden = entries.length <= state.visibleLimit;
  more.textContent = `Show more text (${Math.min(24, entries.length - state.visibleLimit)} of ${entries.length - state.visibleLimit} remaining) ↓`;
  for (const { section, original } of entries.slice(0, state.visibleLimit)) {
    const card = document.createElement('article');
    card.className = `entry${Object.prototype.hasOwnProperty.call(state.draft.overrides, original) ? ' edited' : ''}`;
    const top = document.createElement('div'); top.className = 'entry-top';
    const category = document.createElement('span'); category.className = 'entry-section'; category.textContent = section;
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'reset-field'; reset.textContent = 'Reset';
    top.append(category, reset);
    const source = document.createElement('p'); source.className = 'entry-original'; source.textContent = original;
    const label = document.createElement('label'); label.textContent = 'Replacement text · leave empty to use original';
    const field = document.createElement('textarea'); field.maxLength = 2000; field.rows = Math.min(4, Math.max(1, Math.ceil(original.length / 80)));
    field.placeholder = 'Use original text'; field.value = state.draft.overrides[original] ?? '';
    label.append(field);
    reset.addEventListener('click', () => { delete state.draft.overrides[original]; field.value = ''; card.classList.remove('edited'); saveDraft(); });
    field.addEventListener('input', () => {
      if (field.value && field.value !== original) state.draft.overrides[original] = field.value;
      else delete state.draft.overrides[original];
      card.classList.toggle('edited', Object.prototype.hasOwnProperty.call(state.draft.overrides, original));
      saveDraft();
    });
    card.append(top, source, label);
    container.append(card);
  }
}

function render() { renderNav(); renderEntries(); refreshSummary(); }

function addCustomText() {
  const original = window.prompt('Enter the exact text as it appears in the game:')?.trim();
  if (!original) return;
  if (original.length > 500) { notify('Text must be 500 characters or fewer.'); return; }
  state.custom.add(original);
  state.section = 'Custom text';
  state.search = '';
  $<HTMLInputElement>('#search').value = '';
  render();
  const fields = [...document.querySelectorAll<HTMLTextAreaElement>('.entry textarea')];
  const field = fields[fields.length - 1];
  field?.focus();
}

function downloadBackup() {
  const file = new Blob([JSON.stringify(state.draft, null, 2) + '\n'], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(file);
  link.download = 'ni-mbaya-game-copy.json'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(text: string) {
  const bytes = Uint8Array.from(atob(text.replace(/\s/g, '')), character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function publish() {
  const token = $<HTMLInputElement>('#github-token').value.trim();
  if (!token) { notify('Enter a GitHub token with Contents: write permission to publish.'); return; }
  const button = $<HTMLButtonElement>('#publish');
  button.disabled = true; button.textContent = 'Publishing…';
  try {
    const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' };
    const currentResponse = await fetch(`${API}?ref=main`, { headers, cache: 'no-store' });
    if (!currentResponse.ok) throw new Error(`GitHub could not read the file (${currentResponse.status}). Check token and repository access.`);
    const remote = await currentResponse.json() as { sha: string; content: string };
    const current: unknown = JSON.parse(decodeBase64(remote.content));
    if (!isContent(current)) throw new Error('The repository content file is invalid. Nothing was published.');
    if (JSON.stringify(current.overrides) !== JSON.stringify(state.published.overrides)) {
      throw new Error('The live content changed since you opened this dashboard. Reload and review the newer text before publishing.');
    }
    const response = await fetch(API, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({
      message: 'Update NI MBAYA game copy from Content Studio',
      content: encodeBase64(JSON.stringify(state.draft, null, 2) + '\n'),
      sha: remote.sha, branch: 'main',
    }) });
    if (!response.ok) throw new Error(`GitHub rejected the update (${response.status}). Your draft is still saved locally.`);
    state.published = JSON.parse(JSON.stringify(state.draft)) as Content;
    localStorage.removeItem(DRAFT_KEY);
    $<HTMLInputElement>('#github-token').value = '';
    refreshSummary();
    notify('Published to GitHub. The live game updates after GitHub Pages finishes deploying.');
  } catch (error) { notify(error instanceof Error ? error.message : 'Publishing failed. Your draft is still saved.'); }
  finally { button.disabled = false; button.innerHTML = 'Publish changes <span>↗</span>'; }
}

async function start() {
  try {
    const [contentResponse, catalogResponse] = await Promise.all([fetch(CONTENT_URL, { cache: 'no-store' }), fetch(CATALOG_URL)]);
    if (!contentResponse.ok || !catalogResponse.ok) throw new Error('Content files could not be loaded.');
    const [published, catalog] = await Promise.all([contentResponse.json(), catalogResponse.json()]);
    if (!isContent(published) || catalog?.version !== 1 || !Array.isArray(catalog.sections)) throw new Error('Content files are invalid.');
    state.published = published;
    state.catalog = catalog;
    const saved = safeRead(DRAFT_KEY);
    state.draft = isContent(saved) ? saved : JSON.parse(JSON.stringify(published)) as Content;
    const builtIn = new Set(catalog.sections.flatMap((section: { entries: string[] }) => section.entries));
    Object.keys(state.draft.overrides).forEach(key => { if (!builtIn.has(key)) state.custom.add(key); });
    render();
    if (isContent(saved)) notify('Your local draft was restored.');
  } catch (error) {
    $('#empty-state').hidden = false;
    $('#empty-state').textContent = error instanceof Error ? error.message : 'Could not load content.';
  }
}

$<HTMLInputElement>('#search').addEventListener('input', event => {
  state.search = (event.target as HTMLInputElement).value.trim(); state.visibleLimit = 24; renderEntries();
});
$('#load-more').addEventListener('click', () => { state.visibleLimit += 24; renderEntries(); });
$('#add-text').addEventListener('click', addCustomText);
$('#preview').addEventListener('click', () => {
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(state.draft));
  window.open(new URL('../?contentPreview=1', location.href), '_blank', 'noopener');
});
$('#download').addEventListener('click', downloadBackup);
$<HTMLInputElement>('#import').addEventListener('change', async event => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const candidate: unknown = JSON.parse(await file.text());
    if (!isContent(candidate)) throw new Error('The backup is not a valid NI MBAYA content file.');
    state.draft = candidate;
    Object.keys(candidate.overrides).forEach(key => state.custom.add(key));
    saveDraft(); render(); notify('Backup imported into your local draft.');
  } catch (error) { notify(error instanceof Error ? error.message : 'Import failed.'); }
  (event.target as HTMLInputElement).value = '';
});
$('#discard').addEventListener('click', () => {
  if (!confirm('Discard all local edits and return to the published text?')) return;
  state.draft = JSON.parse(JSON.stringify(state.published)) as Content;
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(PREVIEW_KEY);
  render(); notify('Local draft discarded.');
});
$('#publish').addEventListener('click', publish);
void start();
