#!/usr/bin/env python3
"""Build thunder, sword, heal, ice, fire-ward, earth and spear strips from authored 3x3 keyplate grids, without painting effects.

Plate order in every grid: 0-2 body, 3-4 telegraph, 5-6 impact, 7-8 residue.
"""
from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib, subprocess, re

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art/element-skills-v286838'
GAME = ROOT / 'xiantu-v2831-scroll'
OUT = GAME / 'element-skills-v286838'
FX = GAME / 'xiantu-v2855-skill-fx.js'
V = ROOT / '.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'
OUT.mkdir(exist_ok=True); (ART / 'preview').mkdir(parents=True, exist_ok=True)

EFFECTS = [
    dict(key='thunder_strike', source='thunder', element='thunder', archetype='ground-eruption',
         hue=(250, 300), sizes=dict(telegraph=210, body=330, impact=270, residue=230),
         skills=['雷法', '惊雷闪', '裂地奔雷', '紫霄落雷', '万雷噬狱', '九天神雷', '九霄雷云', '闪电链', '雷神附体', '无音神雷']),
    dict(key='sword_qi', source='sword', element='sword', archetype='projectile',
         hue=(150, 200), sizes=dict(telegraph=150, body=215, impact=220, residue=190),
         skills=['御剑术', '剑气纵横', '万剑归宗', '天地一剑', '清风剑诀', '破甲剑罡', '追魂一剑', '饮血剑诀', '玄罡护体剑']),
    dict(key='jade_lotus_heal', source='heal', element='heal', archetype='ground-eruption',
         hue=(40, 170), sizes=dict(telegraph=200, body=290, impact=250, residue=210),
         skills=['回春术', '治愈术', '生生不息', '起死回生', '凝露诀', '青莲护心', '灵泉归元', '逆命回元', '莲华济世']),
    dict(key='frost_shard', source='ice_shard', element='ice', archetype='projectile',
         hue=(170, 235), sizes=dict(telegraph=160, body=220, impact=230, residue=200),
         skills=['寒冰掌', '玄冰刺', '冰爆术', '霜龙吐息']),
    dict(key='glacier_domain', source='ice_domain', element='ice', archetype='ground-eruption',
         hue=(170, 235), sizes=dict(telegraph=220, body=320, impact=270, residue=230),
         skills=['冰封千里', '霜寒结界', '冰河葬狱', '寒渊领域', '冰魄封魂', '万载寒晶']),
    dict(key='frost_armor', source='ice_armor', element='ice', archetype='ground-eruption',
         hue=(170, 235), sizes=dict(telegraph=200, body=270, impact=250, residue=210),
         skills=['冰甲护身']),
    dict(key='solar_aegis', source='fire_shield', element='fire', archetype='ground-eruption',
         hue=(0, 50), sizes=dict(telegraph=200, body=270, impact=250, residue=210),
         skills=['炎阳护盾']),
    dict(key='flame_bind', source='fire_bind', element='fire', archetype='projectile',
         hue=(0, 50), sizes=dict(telegraph=160, body=220, impact=230, residue=200),
         skills=['流火飞索']),
    dict(key='mountain_quake', source='mountain', element='earth', archetype='ground-eruption',
         hue=(20, 60), sizes=dict(telegraph=220, body=320, impact=280, residue=230),
         skills=['镇岳山河震']),
    dict(key='sun_spear', source='spear', element='spear', archetype='projectile',
         hue=(20, 60), sizes=dict(telegraph=160, body=240, impact=240, residue=200),
         skills=['穿云贯日']),
]
LAYERS = [('telegraph', [3, 4], 4), ('body', [0, 1, 2], 8), ('impact', [5, 6], 6), ('residue', [7, 8], 6)]


def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()


def validate(p, n=9, cols=3, margin=.02):
    r = subprocess.run(['python3', str(V), '--input', str(p), '--frames', str(n), '--columns', str(cols),
                        '--rows', str((n + cols - 1) // cols), '--safe-margin-percent', str(margin)],
                       capture_output=True, text=True)
    print(r.stdout.strip()); assert r.returncode == 0, r.stdout + r.stderr
    return r.stdout.strip()


def key_black(im):
    # Luminous plates on black: brightness becomes coverage, colour is un-premultiplied.
    a = np.asarray(im.convert('RGB')).astype(float)
    m = a.max(2)
    alpha = np.clip((m - 14) / 226, 0, 1) ** .85
    rgb = np.where(alpha[..., None] > 0, a / np.maximum(m[..., None], 1) * 255, 0)
    rgb = rgb * np.clip(m[..., None] / 255 * 1.6, .55, 1)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype('uint8')
    return Image.fromarray(out, 'RGBA')


def bounds(im, threshold=16):
    y, x = np.where(np.asarray(im)[:, :, 3] > threshold)
    return int(x.min()), int(y.min()), int(x.max() + 1), int(y.max() + 1)


def audit(im, hue):
    a = np.asarray(im); m = a[:, :, 3] > 16; assert m.any()
    rgb = a[:, :, :3][m].astype(float) / 255
    mx, mn = rgb.max(1), rgb.min(1); d = mx - mn
    r, g, b = rgb.T
    h = np.where(d == 0, 0, np.where(mx == r, (g - b) / np.maximum(d, 1e-6) % 6,
                                     np.where(mx == g, (b - r) / np.maximum(d, 1e-6) + 2, (r - g) / np.maximum(d, 1e-6) + 4))) * 60
    chroma = d > .12
    inHue = ((h >= hue[0]) & (h <= hue[1]) & chroma).sum() / max(1, chroma.sum())
    return dict(bounds=list(bounds(im)), white=float((mn > .9).mean()), familyHue=float(inHue),
                opaque=float((a[:, :, 3][m] > 128).mean()), hash=hashlib.sha256(im.tobytes()).hexdigest())


def place(cells, ground, box=(200, 165)):
    # One uniform scale and offset per layer, so motion between poses stays registered.
    bs = [bounds(c) for c in cells]
    x0, y0, x1, y1 = min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)
    s = min(box[0] / (x1 - x0), box[1] / (y1 - y0))
    px, py = (x0 + x1) / 2 * s, (y1 if ground else (y0 + y1) / 2) * s
    out = []
    for c in cells:
        scaled = c.resize((round(c.width * s), round(c.height * s)), Image.Resampling.LANCZOS)
        f = Image.new('RGBA', (256, 256)); f.alpha_composite(scaled, (round(128 - px), round((200 if ground else 128) - py)))
        out.append(f)
    return out


effects, reports = [], {}
for E in EFFECTS:
    src = ART / 'source' / E['source']; original = src / 'keyplates-original.jpg'
    keyed = key_black(Image.open(original)); keyed.save(src / 'keyplates-keyed.png')
    alpha = np.asarray(keyed)[:, :, 3].astype(float)
    def gutters(profile, size):
        third = size / 3
        return [0] + [int(lo + np.argmin(profile[lo:hi])) for lo, hi in ((int(third * .8), int(third * 1.2)), (int(third * 1.8), int(third * 2.2)))] + [size]
    rows, cols = gutters(alpha.sum(1), keyed.height), gutters(alpha.sum(0), keyed.width)
    # Faint haze crossing a gutter is cleared so each plate stays an independent stage.
    raw = []
    for i in range(9):
        c = keyed.crop((cols[i % 3], rows[i // 3], cols[i % 3 + 1], rows[i // 3 + 1])); a = np.asarray(c).copy()
        a[:, :, 3] = np.where(a[:, :, 3] > 40, a[:, :, 3], 0); a[:3, :, 3] = a[-3:, :, 3] = 0; a[:, :3, 3] = a[:, -3:, 3] = 0
        raw.append(Image.fromarray(a, 'RGBA'))
    cell = max(max(c.size) for c in raw); pad = round(cell * .2); safeCell = cell + pad * 2
    safe = Image.new('RGBA', (safeCell * 3, safeCell * 3))
    for i, c in enumerate(raw): safe.alpha_composite(c, (i % 3 * safeCell + pad, i // 3 * safeCell + pad))
    safe.save(src / 'keyplates-safe.png')
    checks = [validate(src / 'keyplates-safe.png', margin=.12)]
    ground = E['archetype'] == 'ground-eruption'
    sourceAudit = [audit(c, E['hue']) for c in raw]
    layers, detail, framesets = {}, {}, {}
    for layer, indices, n in LAYERS:
        onGround = ground or layer == 'residue'
        plates = place([raw[i] for i in indices], onGround, (200, 170) if onGround else (205, 150))
        frames = []
        for j in range(n):
            t = j / (n - 1) * (len(indices) - 1); a = min(len(indices) - 2, int(t))
            frames.append(Image.blend(plates[a], plates[a + 1], t - a))
        framesets[layer] = frames
        strip = Image.new('RGBA', (256 * n, 256))
        for i, im in enumerate(frames): strip.alpha_composite(im, (256 * i, 0))
        file = f"{E['key']}_{layer}.png"
        # 256-colour palette keeps alpha gradients (audited MAE about 1/255) at a quarter of the bytes.
        strip.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(OUT / file, optimize=True)
        a = [audit(im, E['hue']) for im in frames]
        assert len({v['hash'] for v in a}) == n, (E['key'], layer, 'duplicate frames')
        assert all(v['familyHue'] > .7 and v['white'] < .3 for v in a), (E['key'], layer, 'palette', [(round(v['familyHue'], 2), round(v['white'], 2)) for v in a])
        assert all(min(v['bounds'][0], v['bounds'][1], 256 - v['bounds'][2], 256 - v['bounds'][3]) >= 20 for v in a), (E['key'], layer, 'bounds')
        detail[layer] = a
        layers[layer] = dict(file=file, frames=n, frameWidth=256, frameHeight=256, pivotX=.5,
                             pivotY=200 / 256 if onGround else .5, fps=30, loop=False, holdLast=False)
    sizes = E['sizes']; end = 600 if ground else 440
    D = dict(key=E['key'], name=E['skills'][0], element=E['element'], visualArchetype=E['archetype'], skills=E['skills'],
             layers=layers, scale=1, offsetX=0, offsetY=0, trailLength=0,
             timing=dict(arrivalMs=310, gatherMs=100, crossfadeMs=40, bodyMs=360, impactMs=180, aftermathMs=end, durationMs=1100),
             display=sizes,
             acceptance=['Independent authored 3x3 stage plates per family; source-over',
                         'Impact waits for the authoritative hit event; self casts anchor on the caster foot',
                         'Shared textures per family; no combat, RNG or timer writes'])
    windows = ({'telegraph': (0, 350, 'target'), 'body': (310, 670, 'target'), 'impact': (310, 490, 'target'), 'residue': (610, 310 + end, 'target')}
               if ground else {'telegraph': (0, 140, 'origin'), 'body': (100, 350, 'moving'), 'impact': (310, 490, 'target'), 'residue': (450, 750, 'target')})
    D['preview'] = dict(displayMode=E['archetype'], durationMs=1100, distance=233,
                        layers={k: dict(start=a / 1100, end=b / 1100, anchor=c, width=sizes[k], height=sizes[k], fadeIn=40 / (b - a), fadeOut=40 / (b - a))
                                for k, (a, b, c) in windows.items()})
    effects.append(D)
    reports[E['key']] = dict(inputs={original.name: digest(original)}, boundaryChecks=checks, sourcePlates=sourceAudit, frames=detail,
                             visiblePixels={k: [[round((v['bounds'][2] - v['bounds'][0]) * sizes[k] / 256, 2), round((v['bounds'][3] - v['bounds'][1]) * sizes[k] / 256, 2)] for v in vals] for k, vals in detail.items()})

manifest = dict(schemaVersion=1, effects=effects)
(ART / 'preview/effect-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ART / 'asset-audit.json').write_text(json.dumps(dict(command='python3 scripts/build-element-skills-vfx.py', effects=reports), indent=2) + '\n')
block = '  // BEGIN ELEMENT BATCH GENERATED\n  const ELEMENT_BATCH=' + json.dumps(effects, ensure_ascii=False, separators=(',', ':')) + ';\n  // END ELEMENT BATCH GENERATED\n'
text = FX.read_text()
pattern = re.compile(r'  // BEGIN ELEMENT BATCH GENERATED\n.*?  // END ELEMENT BATCH GENERATED\n', re.S)
text = pattern.sub(lambda _: block, text) if pattern.search(text) else text.replace('  // BEGIN SOLAR GENERATED CONFIG\n', block + '  // BEGIN SOLAR GENERATED CONFIG\n', 1)
FX.write_text(text)
print('Exported', ', '.join(e['key'] for e in effects), 'for', sum(len(e['skills']) for e in effects), 'skills')
