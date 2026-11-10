#!/usr/bin/env python3
"""Compatibility entry point for the approved orange cat.

blender --background --factory-startup --python build-orange-cat.py
The common pipeline builds calico, black and tabby through -- --kind NAME.
"""
from pathlib import Path
import runpy
import sys

if '--' not in sys.argv:
    sys.argv.append('--')
sys.argv.extend(['--kind', 'orange'])
runpy.run_path(str(Path(__file__).with_name('build-cats.py')),run_name='__main__')
