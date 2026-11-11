#!/usr/bin/env python3
"""Reproducible cat Walk authoring pipeline (Blender 4.3+, Python numpy/scipy, Node 22).

The immutable seated inputs are from main 8812ff5. Outputs are staged separately;
this command never overwrites the shipped cats or deploys the game.
"""
import argparse
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
BASELINE = '8812ff565b29a0f57bdcb80698f6c8b950ca3965'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--kind', choices=['orange', 'calico', 'black', 'tabby', 'all'], default='all')
parser.add_argument('--output-dir', type=Path, required=True)
parser.add_argument('--baseline-dir', type=Path)
parser.add_argument('--blender', default='blender')
args = parser.parse_args()
work = args.output_dir.resolve()
work.mkdir(parents=True, exist_ok=True)
baseline = (args.baseline_dir or work / 'baseline').resolve()
baseline.mkdir(parents=True, exist_ok=True)
kinds = ['orange', 'calico', 'black', 'tabby'] if args.kind == 'all' else [args.kind]
for kind in kinds:
    if args.baseline_dir is None:
        for suffix in ['glb', 'blend']:
            name = f'{kind}-cat.{suffix}'
            data = subprocess.check_output(['git', 'show', f'{BASELINE}:games/healing-game/assets/cats/{name}'], cwd=REPO)
            (baseline / name).write_bytes(data)
    subprocess.run([args.blender, '-b', '-t', '3', '--python', str(ROOT / 'rig.py'), '--', '--kind', kind,
                    '--baseline-dir', str(baseline), '--output-dir', str(work)], check=True)
    current = work / f'{kind}-walk-raw.glb'
    for script, stage in [('repair_surfaces.py', 'surfaces'), ('flatten_bind.py', 'bind'),
                          ('tuck_seated_caps.py', 'seated'), ('pack_skin.py', 'packed'), ('quantize.py', 'quant')]:
        output = work / f'{kind}-walk-{stage}.glb'
        command = [sys.executable, str(ROOT / script), str(current), str(output)]
        if stage == 'surfaces': command.append(str(baseline / f'{kind}-cat.glb'))
        subprocess.run(command, check=True)
        current = output
    subprocess.run(['node', str(ROOT / 'compress.mjs'), str(current), str(work / f'{kind}-cat.glb')], check=True)
