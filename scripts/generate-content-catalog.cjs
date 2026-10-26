const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const folders = ['src/scenes', 'src/ui'];
const extras = ['src/config/WorldContent.ts', 'src/config/Achievements.ts', 'src/config/Levels.ts', 'src/systems/SceneLoadingPlugin.ts', 'src/systems/LoadingStatus.ts'];
extras.push('src/config/StoryContent.ts');
const files = folders.flatMap(folder => fs.readdirSync(path.join(root, folder))
  .filter(file => file.endsWith('.ts')).map(file => `${folder}/${file}`)).concat(extras);
const groups = new Map();
groups.set('Browser and overlays', new Set([
  'PLAY IN LANDSCAPE', 'ROTATE YOUR DEVICE',
  'NI MBAYA is built for a wide fighting arena. Turn your device sideways for the full experience.',
  'Downloading game engine…', 'Skip intro', 'REPLAY', 'UMEVAMIWA!', 'Goons Wamekupiga Mbavu',
]));

function isCopy(value) {
  const text = value.trim();
  if (text.length < 2 || text.length > 500 || /\.(webp|png|mp3|jpg|gif|ttf)/i.test(text)) return false;
  if (/^(#|[\d\s/.,:;!?–—+\-]+$)/.test(text)) return false;
  if (text.includes('://') || text.includes('px') || text.includes('font') || text.includes('rgba(') ||
    /\b(Arial|Impact|sans-serif|serif|prefers-reduced-motion)\b/i.test(text)) return false;
  if (text.includes('<') || text.includes('>') || /^\(pointer:/.test(text) || /^bold\b/i.test(text) ||
    /Scene \(background\)/.test(text)) return false;
  if (/^[a-z][a-z0-9-]*$/.test(text)) return false;
  return /[A-Za-zÀ-ÿ]/.test(text) && (/[\s]/.test(text) || /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9 !?–—:,.]+$/.test(text));
}

for (const relative of files) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const tree = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true);
  const section = path.basename(relative, '.ts').replace(/Scene$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  for (const node of walk(tree)) {
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) continue;
    const value = node.text.trim();
    if (!isCopy(value)) continue;
    // Image keys, internal event names, and CSS tokens are not player copy.
    if (/^(menu-|gameplay-|story-|level\d|options-|fighter-|touch-|nairobi-|kibera-)/i.test(value)) continue;
    if (!groups.has(section)) groups.set(section, new Set());
    groups.get(section).add(value);
  }
}

function* walk(node) {
  yield node;
  for (const child of node.getChildren()) yield* walk(child);
}

const catalog = { version: 1, sections: [...groups].map(([name, values]) => ({
  name, entries: [...values].sort((a, b) => a.localeCompare(b)),
})) };
const target = path.join(root, 'public/content/catalog.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Wrote ${catalog.sections.reduce((total, section) => total + section.entries.length, 0)} text entries to ${target}`);
