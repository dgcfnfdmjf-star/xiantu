"""Deployment boundary tests. Fake remote only; no Tencent calls or credentials."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('xiantu_deploy', ROOT / 'scripts/deploy-xiantu-v2868110.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
SOURCE = ROOT / 'downloads/xiantu-v2831-scroll.zip'


class DeployTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)

    def stage(self):
        stage = self.base / 'stage'
        stage.mkdir()
        return stage, deploy.stage_archive(SOURCE, stage)

    def test_release_hash_and_exact_471_upload_targets(self):
        deploy.verify_zip(SOURCE)
        stage, records = self.stage()
        deploy.verify_stage(stage, records)
        self.assertEqual(len(records), 471)
        self.assertEqual(sum(r['phase'] == 'resources' for r in records), 463)
        self.assertEqual(sum(r['phase'] == 'entries' for r in records), 8)
        self.assertIn('xiantu-v2831-scroll/game-v2762.html', [r['key'] for r in records])
        self.assertTrue(all(deploy.allowed_key(r['key']) for r in records))
        self.assertFalse(list(stage.rglob('index.html')))

    def test_plan_only_default_never_invokes_cli(self):
        with patch.object(deploy, 'publish', side_effect=AssertionError('must not upload')):
            with patch.object(deploy.subprocess, 'run', side_effect=AssertionError('must not run CLI')):
                with contextlib.redirect_stdout(io.StringIO()):
                    deploy.main(['--zip', str(SOURCE), '--work-dir', str(self.base / 'preview')])
        plan = json.loads((self.base / 'preview/upload-plan.json').read_text())
        self.assertEqual(plan['file_count'], 471)
        self.assertFalse(plan['remote_delete'])
        self.assertEqual(plan['protected'], list(deploy.PROTECTED))

    def test_overwrite_preserves_both_garden_locations_and_indices(self):
        stage, records = self.stage()
        protected = {'index.html': b'root garden', 'healing-game/index.html': b'root child garden',
                     'xiantu-v2831-scroll/index.html': b'old entry garden',
                     'xiantu-v2831-scroll/healing-game/index.html': b'nested garden',
                     'xiantu-v2831-scroll/old-unlisted-file.txt': b'keep unlisted'}
        remote = dict(protected)
        remote['xiantu-v2831-scroll/game-v2762.html'] = b'old xiantu'
        calls, writes = [], []

        def runner(command, check):
            self.assertTrue(check)
            self.assertEqual(command[:len(deploy.NPX)], deploy.NPX)
            at = command.index('deploy')
            source, prefix = Path(command[at + 1]), command[at + 2]
            self.assertEqual(prefix, deploy.PREFIX)
            self.assertEqual(command[command.index('-e') + 1], deploy.ENV_ID)
            self.assertIn('--verify', command)
            self.assertNotIn('--prune', command)
            self.assertNotIn('--safe', command)
            if not calls:
                self.assertFalse(any(p.suffix in ('.html', '.webmanifest') for p in source.rglob('*') if p.is_file()))
            else:
                self.assertEqual(len(writes), 463)
                self.assertEqual(command[command.index('--entry') + 1], 'game-v2762.html,game.html')
            calls.append(command)
            for p in source.rglob('*'):
                if p.is_file():
                    key = prefix + '/' + p.relative_to(source).as_posix()
                    self.assertTrue(deploy.allowed_key(key))
                    remote[key] = p.read_bytes()
                    writes.append(key)
        with contextlib.redirect_stdout(io.StringIO()):
            deploy.publish(stage, records, 5, runner)
        self.assertEqual(len(calls), 2)
        self.assertEqual(len(set(writes)), 471)
        self.assertEqual({key: remote[key] for key in protected}, protected)
        self.assertIn(b'28.68.110', remote['xiantu-v2831-scroll/game-v2762.html'])

    def test_failed_resources_or_verify_never_publish_entries(self):
        stage, records = self.stage()
        calls = []
        def fail(command, check):
            calls.append(command)
            raise subprocess.CalledProcessError(1, command)
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(subprocess.CalledProcessError):
            deploy.publish(stage, records, 5, fail)
        self.assertEqual(len(calls), 1)
        self.assertTrue(calls[0][calls[0].index('deploy') + 1].endswith('/resources'))

    def test_stage_rechecked_before_each_phase(self):
        stage, records = self.stage()
        calls = []
        def tamper(command, check):
            calls.append(command)
            (stage / 'entries/index.html').write_text('must not upload')
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(ValueError):
            deploy.publish(stage, records, 5, tamper)
        self.assertEqual(len(calls), 1)

    def test_corruption_missing_file_and_symlink_are_rejected(self):
        stage, records = self.stage()
        target = stage / records[0]['phase'] / records[0]['relative']
        original = target.read_bytes()
        target.write_bytes(b'corrupt')
        with self.assertRaises(ValueError):
            deploy.verify_stage(stage, records)
        target.unlink()
        with self.assertRaises(ValueError):
            deploy.verify_stage(stage, records)
        outside = self.base / 'outside'
        outside.write_bytes(original)
        target.symlink_to(outside)
        with self.assertRaises(ValueError):
            deploy.verify_stage(stage, records)

    def test_malformed_archives_refused_before_any_extraction(self):
        for name in ['../index.html', '/index.html', 'xiantu-v2831-scroll/../index.html',
                     'xiantu-v2831-scroll/healing-game/index.html', 'xiantu-v2831-scroll/a\\index.html']:
            stream = io.BytesIO()
            with zipfile.ZipFile(stream, 'w') as archive:
                archive.writestr(name, 'no')
            stream.seek(0)
            with zipfile.ZipFile(stream) as archive, self.assertRaises(ValueError):
                deploy.archive_members(archive)
        stream = io.BytesIO()
        info = zipfile.ZipInfo('xiantu-v2831-scroll/link')
        info.create_system = 3
        info.external_attr = (stat.S_IFLNK | 0o777) << 16
        with zipfile.ZipFile(stream, 'w') as archive:
            archive.writestr(info, '../index.html')
        stream.seek(0)
        with zipfile.ZipFile(stream) as archive, self.assertRaises(ValueError):
            deploy.archive_members(archive)

    def test_modified_archive_is_not_accepted_as_release(self):
        modified = self.base / 'modified.zip'
        modified.write_bytes(b'not the release')
        with self.assertRaises(ValueError):
            deploy.acquire_zip(self.base, modified)

    def test_only_preview_and_deploy_are_mutually_exclusive(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            deploy.main(['--preview', '--deploy'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
