from pathlib import Path
import json, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets'
LIGHTWEIGHT = '--lightweight' in sys.argv
# Only assets referenced by executable code are shipped. Preserve originals.
refs = set()
for source in (ROOT / 'src').rglob('*.ts'):
    for ref in re.findall(r"new URL\('([^']+)'", source.read_text(encoding='utf-8')):
        path = (source.parent / ref).resolve()
        if path.is_relative_to(ASSETS) and 'optimized' not in path.relative_to(ASSETS).parts:
            refs.add(path)
# On subsequent runs derive the inputs from the optimized references.
    for ref in re.findall(r"new URL\('([^']*assets/optimized/[^']+)'", source.read_text(encoding='utf-8')):
        relative = ref.split('assets/optimized/')[1]
        original = ASSETS / relative
        if original.suffix == '.webp': original = original.with_suffix('.png')
        refs.add(original)
def optimize(original):
    relative = original.relative_to(ASSETS)
    target = ASSETS / 'optimized' / relative
    if original.suffix == '.png': target = target.with_suffix('.webp')
    if original.suffix not in ('.png', '.mp3'): return None
    background = original.suffix == '.png' and 'background' in original.stem
    music = original.name in ('menu-music.mp3', 'fight-music.mp3')
    hover = original.name == 'ui-hover.mp3'
    if LIGHTWEIGHT and not (background or music or hover): return None
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.stem + ".pending" + target.suffix)
    if not LIGHTWEIGHT and target.exists() and target.stat().st_size > 0 and target.stat().st_mtime >= original.stat().st_mtime:
        pass
    elif original.suffix == '.png':
        with Image.open(original) as image:
            if LIGHTWEIGHT and background:
                # Backgrounds fill a 1280x720 arena; keep the originals for art
                # editing, and avoid shipping more texture pixels than needed.
                image.thumbnail((1280, 720), Image.Resampling.LANCZOS)
            # Keep sprite-sheet geometry and alpha exactly aligned to the source.
            image.save(temporary, 'WEBP', quality=72 if LIGHTWEIGHT and background else 88, method=6 if LIGHTWEIGHT else 4, exact=True)
            with Image.open(temporary) as optimized:
                assert image.size == optimized.size, str(original)
                assert ImageChops.difference(image.convert('RGBA').getchannel('A'), optimized.convert('RGBA').getchannel('A')).getbbox() is None, str(original)
            temporary.replace(target)
    else:
        bitrate = '96k' if 'music' in original.name else '64k'
        extra = []
        if LIGHTWEIGHT:
            extra = ['-ac', '1', '-ar', '24000', '-t', '0.6'] if hover else ['-ac', '1', '-ar', '24000']
            bitrate = '48k'
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(original), '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', bitrate, *extra, str(temporary)], check=True)
        temporary.replace(target)
    return {'source': relative.as_posix(), 'output': target.relative_to(ASSETS).as_posix(), 'before': original.stat().st_size, 'after': target.stat().st_size}
with ThreadPoolExecutor(max_workers=4) as pool:
    report = [entry for entry in pool.map(optimize, sorted(refs)) if entry]
if LIGHTWEIGHT and (ROOT / 'scripts/asset-sizes.json').exists():
    previous = {entry['output']: entry for entry in json.loads((ROOT / 'scripts/asset-sizes.json').read_text())}
    previous.update({entry['output']: entry for entry in report})
    report = sorted(previous.values(), key=lambda entry: entry['output'])
(ROOT / 'scripts/asset-sizes.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'assets': len(report), 'before': sum(x['before'] for x in report), 'after': sum(x['after'] for x in report)}))
