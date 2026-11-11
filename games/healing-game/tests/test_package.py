"""Validate V9.5's local cat assets, recording and deterministic release."""
from pathlib import Path
import hashlib
import json
import re
import struct
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
ZIP = ROOT / 'releases/healing-game-v9.5-tencent.zip'
KINDS = ('orange', 'calico', 'black', 'tabby')

class Package(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run(['python3', str(ROOT / 'scripts/build.py')], check=True)
        cls.html = (ROOT / 'site/healing-game/index.html').read_bytes()

    def test_independent_folder_and_crc(self):
        with zipfile.ZipFile(ZIP) as z:
            self.assertEqual(z.namelist(), ['healing-game/index.html', 'healing-game/nightvoyage-bgm.mp3'] + ['healing-game/cats/' + kind + '-cat.glb' for kind in KINDS])
            self.assertEqual(z.read('healing-game/nightvoyage-bgm.mp3'), (ROOT / 'assets/nightvoyage-bgm.mp3').read_bytes())
            for kind in KINDS:
                name = 'cats/' + kind + '-cat.glb'
                self.assertEqual(z.read('healing-game/' + name), (ROOT / 'assets' / name).read_bytes())
                self.assertEqual(z.read('healing-game/' + name), (ROOT / 'site/healing-game' / name).read_bytes())
            self.assertIsNone(z.testzip())
            self.assertEqual(z.read(z.namelist()[0]), self.html)

    def test_recording_identity(self):
        asset = (ROOT / 'site/healing-game/nightvoyage-bgm.mp3').read_bytes()
        self.assertEqual(len(asset), 2161729)
        self.assertEqual(hashlib.sha256(asset).hexdigest(), '19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31')

    def test_version_and_checksum(self):
        self.assertIn('月汐莲湾 V9.5'.encode(), self.html)
        self.assertIn(b'name="garden-version" content="9.5.0"', self.html)
        self.assertIn('V9.5 · 月汐莲湾'.encode(), self.html)
        self.assertEqual(ZIP.with_name('healing-game-v9.5-SHA256SUMS.txt').read_text().split()[0], hashlib.sha256(ZIP.read_bytes()).hexdigest())

    def test_all_inline_scripts_parse(self):
        scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', self.html.decode())
        self.assertEqual(len(scripts), 19)
        with tempfile.TemporaryDirectory() as tmp:
            for i, script in enumerate(scripts):
                path = Path(tmp) / f'{i}.js'
                path.write_text(script)
                subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)

    def test_no_remote_assets(self):
        # URLs in the embedded MIT library comments are not network assets.
        markup = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', self.html.decode())
        self.assertFalse(re.search(r'(?:src|href)=["\'](?:https?:)?//', markup))

    def test_cats_embedded_and_mobile_budget(self):
        total_bytes = 0
        for kind in KINDS:
            asset = (ROOT / 'assets/cats' / (kind + '-cat.glb')).read_bytes()
            total_bytes += len(asset)
            self.assertEqual(struct.unpack_from('<III', asset), (0x46546C67, 2, len(asset)))
            length, chunk = struct.unpack_from('<II', asset, 12)
            self.assertEqual(chunk, 0x4E4F534A)
            data = json.loads(asset[20:20 + length])
            self.assertFalse(data.get('extensionsRequired'))
            self.assertTrue(data['images'])
            self.assertTrue(all('bufferView' in image and 'uri' not in image for image in data['images']))
            self.assertTrue(all('uri' not in buffer for buffer in data['buffers']))
            triangles = 0
            for mesh in data['meshes']:
                for primitive in mesh['primitives']:
                    self.assertEqual(primitive.get('mode', 4), 4)
                    triangles += data['accessors'][primitive['indices']]['count'] // 3
            self.assertGreater(triangles, 0)
            # Keep the optimized runtime mesh; the retained 35k source is Blender-only.
            self.assertLessEqual(triangles, 10000)
        # Prevent reintroducing the measured high-detail loading/rendering regression.
        self.assertLess(total_bytes, 2_000_000)

    def test_reproducible_release(self):
        before = ZIP.read_bytes()
        subprocess.run(['python3', str(ROOT / 'scripts/build.py')], check=True)
        self.assertEqual(before, ZIP.read_bytes())

if __name__ == '__main__':
    unittest.main()
