"""Export authored solar-fire plates; no procedural painting or gameplay changes.

Requires Pillow and numpy for the offline art build only. Original authored cells
are intact. Expand source-cell padding before validation; never crop a clipped tip.
"""
from pathlib import Path
import hashlib, json, math, subprocess, sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'art/solar-fire-v286830'
OUT = ROOT / 'xiantu-v2831-scroll/solar-fire-v286830'
AUDIT = ROOT / 'output/playwright/solar-fire-v286830'
OUT.mkdir(exist_ok=True)
AUDIT.mkdir(parents=True, exist_ok=True)
VALIDATOR = ROOT / '.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
source = Image.open(ART / 'keyplates-original.png').convert('RGBA')
assert source.size == (1536, 1024)
safe = Image.new('RGBA', (1920, 1280))
for i in range(6):
    cell = source.crop((i % 3 * 512, i // 3 * 512, (i % 3 + 1) * 512, (i // 3 + 1) * 512))
    alpha = np.array(cell)[:, :, 3]
    assert max(alpha[:3].max(), alpha[-3:].max(), alpha[:, :3].max(), alpha[:, -3:].max()) <= 12
    safe.paste(cell, (i % 3 * 640 + 64, i // 3 * 640 + 64))
safe.save(ART / 'keyplates-safe.png')
subprocess.run([sys.executable, str(VALIDATOR), '--input', str(ART / 'keyplates-safe.png'),
                '--frames', '6', '--columns', '3', '--rows', '2', '--safe-margin-percent', '.18'], check=True)
# Slicing is allowed only after the complete expanded source passes the audit.
plates = [safe.crop((i % 3 * 640, i // 3 * 640, (i % 3 + 1) * 640, (i // 3 + 1) * 640)) for i in range(6)]
# Register source plates by their authored visible center / foot ring. This is
# translation of complete raster content, not repainting or cropping its edges.
registration = []
for i, plate in enumerate(plates):
    alpha = np.asarray(plate)[:, :, 3] / 255
    yy, xx = np.indices(alpha.shape)
    weights = alpha * alpha
    if i >= 3:
        weights *= (yy >= 406) & (yy <= 429)
    pivot = (float((xx * weights).sum() / weights.sum()), float((yy * weights).sum() / weights.sum()))
    target = (320, 320 if i < 3 else 416)
    shift = (round(target[0] - pivot[0]), round(target[1] - pivot[1]))
    normalized = Image.new('RGBA', plate.size)
    normalized.paste(plate, shift)
    # A safe translation cannot remove any meaningful painted alpha.
    assert (np.asarray(normalized)[:, :, 3] > 12).sum() == (np.asarray(plate)[:, :, 3] > 12).sum()
    plates[i] = normalized
    registration.append(dict(plate=i, observedPivot=pivot, targetPivot=target, translate=shift))
plates[0].save(ART / 'material-master.png')

def faded(image, value):
    image = image.copy()
    image.putalpha(image.getchannel('A').point(lambda a: round(a * value)))
    return image

# Interpolate authored raster plates only; the solar body never stretches.
frames = {
    'telegraph': [faded(plates[2], v) for v in [.35, .6, .82, 1]],
    'body': [Image.blend(plates[0], plates[1], (1 - math.cos(i / 8 * math.tau)) / 2) for i in range(8)],
    'impact': [Image.blend(plates[3], plates[4], i / 5) for i in range(6)],
    'residue': [faded(plates[5], 1 - i / 7) for i in range(6)],
}
layers = {}
records = []
for layer, sequence in frames.items():
    size = 192 if layer == 'body' else 256
    strip = Image.new('RGBA', (size * len(sequence), size))
    hashes = set()
    for i, frame in enumerate(sequence):
        frame = frame.resize((size, size), Image.Resampling.LANCZOS)
        strip.paste(frame, (i * size, 0))
        pixels = np.asarray(frame)
        visible = pixels[:, :, 3] > 12
        assert visible.any()
        rgb = pixels[:, :, :3].astype(float)
        alpha = pixels[:, :, 3] / 255
        mass = alpha[visible].sum()
        white = ((rgb.min(axis=2) > 230) & visible)
        # Gold/orange fire may have yellow-white filaments but must retain midtones.
        material = (rgb[:, :, 0] > rgb[:, :, 2] * 1.25) & visible
        white_share = float(alpha[white].sum() / mass)
        material_share = float(alpha[material].sum() / mass)
        assert white_share < .08, (layer, i, 'white coverage', white_share)
        assert material_share > .8, (layer, i, 'colored material', material_share)
        digest = hashlib.sha256(frame.tobytes()).hexdigest()
        hashes.add(digest)
        ys, xs = np.where(visible)
        records.append(dict(layer=layer, frame=i, sha256=digest,
                            bounds=[int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
                            whiteCoverage=white_share, coloredMaterialCoverage=material_share))
    # Body intentionally closes its loop; no neighbouring frame is identical.
    assert len(hashes) >= (len(sequence) // 2 if layer == 'body' else len(sequence))
    file = 'solar_' + layer + '.png'
    strip.save(OUT / file, optimize=True)
    subprocess.run([sys.executable, str(VALIDATOR), '--input', str(OUT / file),
                    '--frames', str(len(sequence)), '--columns', str(len(sequence)), '--rows', '1'], check=True)
    layers[layer] = dict(file=file, frames=len(sequence), frameWidth=size, frameHeight=size,
                         pivotX=.5, pivotY=.5 if layer in ('body', 'telegraph') else .65,
                         fps=dict(body=32, telegraph=32, impact=34, residue=17)[layer],
                         loop=layer == 'body', holdLast=False)

effect = dict(key='solar_true_fire', name='太阳真火', element='fire', visualArchetype='projectile',
              layers=layers, scale=1, offsetX=0, offsetY=0, trailLength=42,
              timing=dict(defaultArrival=310, anticipationFraction=.35, impactMs=180,
                          aftermathMs=540, transitionMs=60, missedFadeMs=150),
              display=dict(body=128, telegraph=205, impact=350, residue=350),
              preview=dict(displayMode='projectile', motion='travel', durationMs=850, distance=233,
                           layers=dict(
                               telegraph=dict(start=0, end=.16, anchor='origin', width=205, height=205, fadeOut=.22),
                               body=dict(start=0, end=310/850, anchor='moving', width=128, height=128),
                               impact=dict(start=310/850, end=490/850, anchor='target', width=350, height=350, fadeOut=1/3),
                               residue=dict(start=430/850, end=1, anchor='target', width=350, height=350, fadeIn=1/7, fadeOut=.25))),
              acceptance=['Fixed-size solar body; no additional hits or RNG',
                          'Impact requires the existing hit event; locked target ground',
                          'Shared ground pivot and complementary impact/residue opacity',
                          'All layers expire, including misses and reduced-motion mode'])
manifest = dict(schemaVersion=1, effects=[effect])
text = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
for file in ['effect-manifest.json', 'effect-manifest.preview.json']:
    (OUT / file).write_text(text)
# Runtime consumes this exact definition, embedded to preserve the 40-script loader.
runtime = ROOT / 'xiantu-v2831-scroll/xiantu-v2855-skill-fx.js'
start, end = '  // BEGIN SOLAR GENERATED CONFIG', '  // END SOLAR GENERATED CONFIG'
code = runtime.read_text()
definition = start + '\n  const SOLAR = ' + json.dumps(effect, ensure_ascii=False, separators=(',', ':')) + ';\n' + end
if start in code:
    a, tail = code.split(start, 1)
    _, b = tail.split(end, 1)
    code = a + definition + b
else:
    code = code.replace("  let quality='auto';", definition + "\n  let quality='auto';", 1)
runtime.write_text(code)
hashfile = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report = dict(source=str(ART.relative_to(ROOT)), registration=registration, original=hashfile(ART/'keyplates-original.png'),
              safe=hashfile(ART/'keyplates-safe.png'), manifest=hashfile(OUT/'effect-manifest.json'),
              output={p.name: hashfile(p) for p in sorted(OUT.glob('*.png'))}, frames=records)
(AUDIT/'asset-audit.json').write_text(json.dumps(report, indent=2)+'\n')
print('PASS solar sources, alpha, palette, white coverage, distinct frames and manifest export')
