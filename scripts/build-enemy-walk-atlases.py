"""Pack generated 4x3 alpha sheets into fixed map-animation cells; no repainting.

Usage: python3 scripts/build-enemy-walk-atlases.py /path/to/sources.json
The JSON maps family names to their original generated PNG paths. Originals stay
outside the release; source hashes and extraction geometry are recorded below.
"""
import hashlib
import json
import pathlib
import sys
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
output = root / 'xiantu-v2831-scroll/art/monsters/walk-v1'
output.mkdir(parents=True, exist_ok=True)
sources = json.loads(pathlib.Path(sys.argv[1]).read_text())
manifest = {'cell': [128, 160], 'size': [512, 480], 'feet': 148,
            'rows': ['front', 'side', 'rear'], 'cycle': [1, 2, 3, 2], 'families': {}}
for family, source in sorted(sources.items()):
    path = pathlib.Path(source)
    image = Image.open(path).convert('RGBA')
    frames = []
    extent = height = 1
    for row in range(3):
        for col in range(4):
            rect = (round(col * image.width / 4), round(row * image.height / 3),
                    round((col + 1) * image.width / 4), round((row + 1) * image.height / 3))
            cell = image.crop(rect)
            # Ignore near-transparent antialias speckles for the crop measurement only.
            bounds = cell.getchannel('A').point(lambda a: 255 if a >= 40 else 0).getbbox()
            if bounds is None:
                raise ValueError(f'{family} empty cell {col},{row}')
            left, top, right, bottom = bounds
            bounds = (max(0, left-2), max(0, top-2), min(cell.width, right+2), min(cell.height, bottom+2))
            extent = max(extent, abs(bounds[0]-cell.width/2), abs(bounds[2]-cell.width/2))
            height = max(height, bounds[3]-bounds[1])
            frames.append((cell, bounds, rect))
    scale = min(58/extent, 138/height)
    atlas = Image.new('RGBA', (512, 480))
    geometry = []
    for index, (cell, bounds, rect) in enumerate(frames):
        cut = cell.crop(bounds)
        w, h = max(1, round(cut.width*scale)), max(1, round(cut.height*scale))
        cut = cut.resize((w, h), Image.Resampling.LANCZOS)
        x, y = round(64+(bounds[0]-cell.width/2)*scale), 148-h
        if x < 3 or x+w > 125 or y < 3:
            raise ValueError(f'{family} packing exceeds transparent padding')
        atlas.alpha_composite(cut, (index%4*128+x, index//4*160+y))
        geometry.append({'sourceCell': rect, 'crop': bounds, 'packed': [x, y, w, h]})
    target = output / f'{family}.webp'
    atlas.save(target, 'WEBP', quality=90, method=6)
    manifest['families'][family] = {'file': target.name, 'bytes': target.stat().st_size,
        'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'sourceSize': list(image.size), 'frames': geometry}
(output / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(f'Packed {len(sources)} families, 12 frames each; '+str(sum(v['bytes'] for v in manifest['families'].values()))+' bytes')
