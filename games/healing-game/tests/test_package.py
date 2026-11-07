"""Validate the shipped two-file game, including deterministic rebuilds."""
from pathlib import Path
import hashlib
import re
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
ZIP = REPO / 'downloads/healing-game-v9.1-tencent.zip'

class Package(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run(['python3', str(ROOT / 'scripts/build.py')], check=True)
        cls.html = (ROOT / 'site/healing-game/index.html').read_bytes()

    def test_independent_folder_and_crc(self):
        with zipfile.ZipFile(ZIP) as z:
            self.assertEqual(z.namelist(), ['healing-game/index.html', 'healing-game/nightvoyage-bgm.mp3'])
            self.assertEqual(z.read('healing-game/nightvoyage-bgm.mp3'), (ROOT / 'assets/nightvoyage-bgm.mp3').read_bytes())
            self.assertIsNone(z.testzip())
            self.assertEqual(z.read(z.namelist()[0]), self.html)

    def test_recording_identity(self):
        asset = (ROOT / 'site/healing-game/nightvoyage-bgm.mp3').read_bytes()
        self.assertEqual(len(asset), 2161729)
        self.assertEqual(hashlib.sha256(asset).hexdigest(), '19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31')

    def test_version_and_checksum(self):
        self.assertIn('月汐莲湾 V9.1'.encode(), self.html)
        self.assertIn(b'name="garden-version" content="9.1.0"', self.html)
        self.assertIn('V9.1 · 月汐莲湾'.encode(), self.html)
        self.assertEqual(ZIP.with_name('healing-game-v9.1-SHA256SUMS.txt').read_text().split()[0], hashlib.sha256(ZIP.read_bytes()).hexdigest())

    def test_all_inline_scripts_parse(self):
        scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', self.html.decode())
        self.assertEqual(len(scripts), 17)
        with tempfile.TemporaryDirectory() as tmp:
            for i, script in enumerate(scripts):
                path = Path(tmp) / f'{i}.js'
                path.write_text(script)
                subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)

    def test_no_remote_assets(self):
        # URLs in the embedded MIT library comments are not network assets.
        markup = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', self.html.decode())
        self.assertFalse(re.search(r'(?:src|href)=["\'](?:https?:)?//', markup))

    def test_reproducible_release(self):
        before = ZIP.read_bytes()
        subprocess.run(['python3', str(ROOT / 'scripts/build.py')], check=True)
        self.assertEqual(before, ZIP.read_bytes())

if __name__ == '__main__':
    unittest.main()
