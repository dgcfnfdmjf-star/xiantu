"""Validate the shipped single-file game, including deterministic rebuilds."""
from pathlib import Path
import hashlib
import re
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
ZIP = REPO / 'downloads/healing-game-v8-tencent.zip'

class Package(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run(['python3', str(ROOT / 'scripts/build.py')], check=True)
        cls.html = (ROOT / 'site/healing-game/index.html').read_bytes()

    def test_independent_folder_and_crc(self):
        with zipfile.ZipFile(ZIP) as z:
            self.assertEqual(z.namelist(), ['healing-game/index.html'])
            self.assertIsNone(z.testzip())
            self.assertEqual(z.read(z.namelist()[0]), self.html)

    def test_version_and_checksum(self):
        self.assertIn('晨风铃谷 V8.0'.encode(), self.html)
        self.assertIn(b'name="garden-version" content="8.0.0"', self.html)
        self.assertIn('V8.0 · 晨风铃谷'.encode(), self.html)
        self.assertEqual(ZIP.with_name('healing-game-v8-SHA256SUMS.txt').read_text().split()[0], hashlib.sha256(ZIP.read_bytes()).hexdigest())

    def test_all_inline_scripts_parse(self):
        scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', self.html.decode())
        self.assertEqual(len(scripts), 13)
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
