"""Mechanically pack generated NPC sheets using the enemy 4x3 atlas convention.

Usage: python3 scripts/build-npc-walk-atlases.py /path/to/sources.json
sources.json maps mentor/beast/elder/trader to generated transparent PNGs.
This only crops, uniformly resizes and encodes artwork; it does not paint frames.
Original images remain outside the release, identified by SHA-256 in manifest.json.
"""
import hashlib
import json
import pathlib
import sys
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
output = root / 'xiantu-v2831-scroll/art/npc/walk-v1'
sources = json.loads(pathlib.Path(sys.argv[1]).read_text())
# Original body extents in map units; the child retains its smaller stature.
body_limits = {'mentor': (74, 90), 'beast': (56, 70),
               'elder': (58, 86), 'trader': (62, 86)}
if set(sources) != set(body_limits):
    raise ValueError('Exactly four NPC sources are required')
output.mkdir(parents=True, exist_ok=True)
manifest = {'cell': [256, 320], 'size': [1024, 960], 'feet': 296,
            'drawSize': [80, 100], 'drawFeet': 24,
            'rows': ['front', 'side', 'rear'], 'cycle': [1, 2, 3, 2], 'npcs': {}}
for npc, source in sorted(sources.items()):
    path = pathlib.Path(source)
    image = Image.open(path).convert('RGBA')
    if image.getchannel('A').getextrema()[0] != 0:
        raise ValueError(f'{npc}: expected transparent background')
    # Generated sheets have uneven row gutters. Cut in the actual transparent gaps,
    # rather than letting a nominal third include the next row's hat or clip its head.
    occupied = image.getchannel('A').point(lambda a: 255 if a >= 40 else 0).getprojection()[1]
    gaps = []
    start = None
    for y, active in enumerate(list(occupied) + [1]):
        if not active and start is None:
            start = y
        elif active and start is not None:
            if y-start >= 4:
                gaps.append((start+y)//2)
            start = None
    row_cuts = [0]
    for boundary in (image.height/3, image.height*2/3):
        candidates = [y for y in gaps if abs(y-boundary) < image.height/8]
        if not candidates:
            raise ValueError(f'{npc}: no transparent gutter near row boundary')
        row_cuts.append(min(candidates, key=lambda y: abs(y-boundary)))
    row_cuts.append(image.height)
    frames = []
    extents = [1, 1, 1]
    heights = [1, 1, 1]
    for row in range(3):
        for col in range(4):
            rect = (round(col * image.width / 4), row_cuts[row],
                    round((col + 1) * image.width / 4), row_cuts[row+1])
            cell = image.crop(rect)
            bounds = cell.getchannel('A').point(lambda a: 255 if a >= 40 else 0).getbbox()
            if bounds is None:
                raise ValueError(f'{npc}: empty cell {col},{row}')
            left, top, right, bottom = bounds
            bounds = (max(0, left-2), max(0, top-2), min(cell.width, right+2), min(cell.height, bottom+2))
            extents[row] = max(extents[row], abs(bounds[0]-cell.width/2), abs(bounds[2]-cell.width/2))
            heights[row] = max(heights[row], bounds[3]-bounds[1])
            frames.append((cell, bounds, rect))
    width_limit, height_limit = body_limits[npc]
    # Normalize each direction as a unit; all four poses in that row share a scale.
    scales = [min(width_limit / (.3125 * 2 * e), height_limit / (.3125 * h))
              for e, h in zip(extents, heights)]
    atlas = Image.new('RGBA', (1024, 960))
    geometry = []
    for index, (cell, bounds, rect) in enumerate(frames):
        scale = scales[index//4]
        cut = cell.crop(bounds)
        w, h = max(1, round(cut.width*scale)), max(1, round(cut.height*scale))
        cut = cut.resize((w, h), Image.Resampling.LANCZOS)
        x, y = round(128+(bounds[0]-cell.width/2)*scale), 296-h
        if x < 6 or x+w > 250 or y < 6:
            raise ValueError(f'{npc}: packing exceeds transparent padding')
        atlas.alpha_composite(cut, (index%4*256+x, index//4*320+y))
        geometry.append({'sourceCell': rect, 'crop': bounds, 'packed': [x, y, w, h]})
    target = output / f'{npc}.webp'
    atlas.save(target, 'WEBP', quality=92, method=6)
    manifest['npcs'][npc] = {'file': target.name, 'bytes': target.stat().st_size,
        'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'sourceSize': list(image.size), 'bodyLimit': list(body_limits[npc]), 'frames': geometry}
(output / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(f'Packed {len(sources)} NPCs, 12 frames each; ' +
      str(sum(v['bytes'] for v in manifest['npcs'].values())) + ' bytes')
