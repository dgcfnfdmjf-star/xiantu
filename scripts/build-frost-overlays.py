#!/usr/bin/env python3
"""Bake the north-snow border melt as small RGBA overlays for the west/east panoramas.

WORLD_REGIONS layout: west sits left of north (its right edge faces north) and
east sits below north (its top edge faces north). Frost is densest on that edge
and melts out across the map; tree crowns, roofs and rock tops (surfaces brighter
than what lies just below them) catch more of it than flat ground.
Output is half resolution; the game scales it over the panorama.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / 'xiantu-v2831-scroll'
JOBS = {
    'west': ('west-panorama-v286898.webp', 'west-frost-v2900.webp', 'right'),
    'east': ('east-panorama-v286898.webp', 'east-frost-v2900.webp', 'top'),
}
SNOW = np.array([238, 243, 247], np.float32)

def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)

def lowfreq_noise(h, w, seed):
    rng = np.random.default_rng(seed)
    small = Image.fromarray((rng.random((h // 40 + 2, w // 40 + 2)) * 255).astype(np.uint8))
    return np.asarray(small.resize((w, h), Image.BICUBIC), np.float32) / 255 - .5

def build(src, edge, seed):
    base = Image.open(src).convert('RGB')
    W, H = base.size[0] // 2, base.size[1] // 2
    rgb = np.asarray(base.resize((W, H), Image.LANCZOS), np.float32)
    lum = rgb @ np.array([.299, .587, .114], np.float32)
    lum = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32)
    # Upward-facing surfaces: brighter than the pixels a few rows below.
    below = np.vstack([lum[4:], np.repeat(lum[-1:], 4, 0)])
    top = smooth((lum - below) / 38)
    foliage = smooth((rgb[..., 1] - rgb[..., 0]) / 30) * smooth((150 - lum) / 90)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = (W - 1 - xx) / W if edge == 'right' else yy / H   # 0 at the north-facing edge
    d = d + lowfreq_noise(H, W, seed) * .12                  # irregular melt line, not a ruler cut
    reach = smooth(1 - d / .62)
    alpha = reach * (.3 + .75 * top + .4 * foliage) + smooth(1 - d / .07) * .25
    alpha = np.clip(alpha, 0, .86)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8)))
    out = np.dstack([np.broadcast_to(SNOW, (H, W, 3)).astype(np.uint8), alpha])
    return Image.fromarray(out, 'RGBA')

def main():
    for i, (region, (src, dst, edge)) in enumerate(JOBS.items()):
        img = build(ROOT / src, edge, 2900 + i)
        img.save(ROOT / dst, 'WEBP', quality=72, alpha_quality=70, method=6)
        print(region, dst, (ROOT / dst).stat().st_size, 'bytes', img.size)

if __name__ == '__main__':
    sys.exit(main())
