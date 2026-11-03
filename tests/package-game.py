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
    def test_art_preview_exclusions_preserve_runtime_layers_and_diagnostics(self):
        kit=self.site/'fire-skills-batch1';kit.mkdir()
        for name in ['index.html','preview.js','stage-reference.webp','effect-manifest.preview.json','impact.png','definition.js','effect-manifest.json']:
            (kit/name).write_text('fixture')
        for name in ['jev-check.html','health-v2762.html','skill-fx-v2855.html','skill-fx-v2854.html']:
            (self.site/name).write_text('fixture')
        self.manifest.write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(self.site))+'\n' for p in self.site.rglob('*') if p.is_file() and p!=self.manifest))
        r=self.invoke();self.assertEqual(r.returncode,0,r.stderr)
        with zipfile.ZipFile(self.target) as z:
            names=z.namelist()
            for name in ['impact.png','definition.js','effect-manifest.json']:self.assertIn('xiantu-v2831-scroll/fire-skills-batch1/'+name,names)
            for name in ['index.html','preview.js','stage-reference.webp','effect-manifest.preview.json']:self.assertNotIn('xiantu-v2831-scroll/fire-skills-batch1/'+name,names)
            for name in ['jev-check.html','health-v2762.html','skill-fx-v2855.html']:self.assertIn('xiantu-v2831-scroll/'+name,names)
            self.assertNotIn('xiantu-v2831-scroll/skill-fx-v2854.html',names)
        self.assertTrue((kit/'preview.js').exists(),'source artwork is retained')
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
    def test_missing_art_with_refreshed_manifest_preserves_previous_archive(self):
        self.target.parent.mkdir();self.target.write_bytes(b'previous release')
        page=self.site/'game.html';page.write_text('<img src="./lost.webp?v=next">')
        self.manifest.write_text(hashlib.sha256(page.read_bytes()).hexdigest()+'  game.html\n')
        r=self.invoke();self.assertNotEqual(r.returncode,0);self.assertIn('lost.webp',r.stderr)
        self.assertEqual(self.target.read_bytes(),b'previous release')
    def test_nested_art_and_query_are_shipped(self):
        (self.site/'art').mkdir();art=self.site/'art/picture.webp';art.write_bytes(b'fixture art')
        page=self.site/'game.html';page.write_text('<img src="./art/picture.webp?v=next">')
        self.manifest.write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(self.site))+'\n' for p in [page,art]))
        self.assertEqual(self.invoke().returncode,0)
        with zipfile.ZipFile(self.target) as z:self.assertEqual(z.read('xiantu-v2831-scroll/art/picture.webp'),b'fixture art')
        self.assertFalse(list(self.target.parent.glob('*.tmp')))
    def test_write_failure_keeps_previous_archive_and_removes_scratch(self):
        self.target.parent.mkdir();self.target.write_bytes(b'previous release')
        script=self.root/'scripts/package-game.py'
        script.write_text(script.read_text().replace("for p in files:z.write(p,site.name+'/'+p.relative_to(site).as_posix())","raise OSError('simulated write failure')"))
        r=self.invoke();self.assertNotEqual(r.returncode,0);self.assertIn('simulated write failure',r.stderr)
        self.assertEqual(self.target.read_bytes(),b'previous release')
        self.assertFalse(list(self.target.parent.glob('*.tmp')))
if __name__=='__main__':unittest.main()
