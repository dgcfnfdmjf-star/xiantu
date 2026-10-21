"""Exercise packaging integrity without altering the real release or player files."""
import hashlib, json, pathlib, shutil, subprocess, sys, tempfile, unittest, zipfile
SCRIPT=pathlib.Path(__file__).resolve().parents[1]/'scripts/package-game.py'
class Packaging(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=pathlib.Path(self.tmp.name);(self.root/'scripts').mkdir()
        shutil.copy(SCRIPT,self.root/'scripts/package-game.py')
        (self.root/'scripts/checksums.py').write_text('')
        (self.root/'package.json').write_text(json.dumps({'version':'28.68.50'}))
        self.site=self.root/'xiantu-v2831-scroll';self.site.mkdir()
        (self.site/'game.html').write_text('<title>fixture</title>')
        self.manifest=self.site/'checksums.sha256'
        self.manifest.write_text(hashlib.sha256((self.site/'game.html').read_bytes()).hexdigest()+'  game.html\n')
        self.target=self.root/'dist/xiantu-v2868.50-game-folder.zip'
    def invoke(self):
        return subprocess.run([sys.executable,str(self.root/'scripts/package-game.py')],capture_output=True,text=True)
    def test_valid_package_keeps_original_folder(self):
        r=self.invoke();self.assertEqual(r.returncode,0,r.stderr)
        with zipfile.ZipFile(self.target) as z:
            self.assertEqual(z.namelist(),['xiantu-v2831-scroll/game.html'])
            self.assertEqual(z.read(z.namelist()[0]),(self.site/'game.html').read_bytes())
    def test_changed_runtime_does_not_replace_existing_archive(self):
        self.target.parent.mkdir();self.target.write_bytes(b'previous release')
        (self.site/'game.html').write_text('changed')
        self.assertNotEqual(self.invoke().returncode,0)
        self.assertEqual(self.target.read_bytes(),b'previous release')
    def test_unlisted_runtime_is_rejected(self):
        (self.site/'new.js').write_text('new code')
        self.assertNotEqual(self.invoke().returncode,0);self.assertFalse(self.target.exists())
    def test_failed_repository_check_stops_before_archive(self):
        (self.root/'scripts/checksums.py').write_text('raise SystemExit(1)')
        self.assertNotEqual(self.invoke().returncode,0);self.assertFalse(self.target.exists())
if __name__=='__main__':unittest.main()
