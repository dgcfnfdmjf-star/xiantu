#!/usr/bin/env python3
"""Pinned V28.68.110 upload plan. Default: local preview; --deploy: CloudBase PUTs.

No remote delete, prune, rollback, bucket-policy or cloud-function operations.
Both index.html entry objects and every healing-game/ object remain outside the plan.
"""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shlex
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile

VERSION = '28.68.110'
CLI_VERSION = '3.9.0'
ENV_ID = 'xiantu-game-d9gy5heze4b039bf1'
PREFIX = 'xiantu-v2831-scroll'
SITE = f'https://{ENV_ID}-1255918878.tcloudbaseapp.com'
RELEASE = '7070a39fc80a1dada98b403d2d63ea02637b0126'
ZIP_URL = f'https://github.com/dgcfnfdmjf-star/xiantu/raw/{RELEASE}/downloads/{PREFIX}.zip'
ZIP_SHA256 = '0c59457c8793e89d2e45923f9b53a6c2831690e92c31b62e0029a12a471fe221'
ZIP_BYTES = 64133352
ZIP_FILES = 472
UPLOAD_FILES = 471
MAX_EXPANDED_BYTES = 150 * 1024 * 1024
PROTECTED = ('index.html', f'{PREFIX}/index.html', 'healing-game/', f'{PREFIX}/healing-game/')
NPX = ['npx', '--yes', '--package', f'@cloudbase/cli@{CLI_VERSION}', 'tcb']


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def verify_zip(path):
    if not path.is_file() or path.stat().st_size != ZIP_BYTES or digest(path) != ZIP_SHA256:
        raise ValueError('ZIP 与固定 V28.68.110 完整包不符。请使用未修改的原始 ZIP；脚本会自动排除 index.html。')


def acquire_zip(work, supplied=None):
    if supplied is not None:
        path = Path(supplied).expanduser().resolve()
        verify_zip(path)
        return path
    path = work / 'xiantu-v2868110-original.zip'
    if path.exists():
        verify_zip(path)
        return path
    for attempt in range(3):
        fd, scratch = tempfile.mkstemp(prefix='download-', suffix='.part', dir=work)
        try:
            req = urllib.request.Request(ZIP_URL, headers={'User-Agent': 'Xiantu-Deploy/28.68.110'})
            with os.fdopen(fd, 'wb') as target, urllib.request.urlopen(req, timeout=60) as response:
                size = 0
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > ZIP_BYTES:
                        raise ValueError('下载大小超出固定发行包，已停止。')
                    target.write(chunk)
            verify_zip(Path(scratch))
            os.replace(scratch, path)
            return path
        except (OSError, ValueError) as error:
            if attempt == 2:
                raise RuntimeError('下载失败。可将原始 ZIP 上传到 Cloud Shell，然后使用 --zip 路径。') from error
            time.sleep(2 * (attempt + 1))
        finally:
            Path(scratch).unlink(missing_ok=True)
    raise RuntimeError('未获得发行包')


def allowed_key(key):
    parts = key.split('/')
    return (len(parts) >= 2 and parts[0] == PREFIX and
            all(part and part not in ('.', '..', 'healing-game') for part in parts) and
            '\\' not in key and key not in PROTECTED and
            not any(key.startswith(p) for p in PROTECTED if p.endswith('/')))


def archive_members(archive):
    """Validate the entire archive before extracting a single member."""
    seen, files, expanded = set(), [], 0
    for info in archive.infolist():
        raw = info.filename
        parts = raw.rstrip('/').split('/')
        if (not parts or parts[0] != PREFIX or '\\' in raw or
                any(not p or p in ('.', '..') for p in parts) or
                raw in seen or stat.S_IFMT(info.external_attr >> 16) == stat.S_IFLNK):
            raise ValueError(f'ZIP 包含不安全或重复路径: {raw!r}')
        seen.add(raw)
        if info.is_dir():
            continue
        if len(parts) < 2 or info.flag_bits & 1:
            raise ValueError('ZIP 路径或加密属性不符合发行包要求')
        expanded += info.file_size
        if expanded > MAX_EXPANDED_BYTES:
            raise ValueError('ZIP 解压大小超限')
        if raw == f'{PREFIX}/index.html':
            files.append((info, None))
        elif not allowed_key(raw):
            raise ValueError(f'拒绝触及受保护路径: {raw}')
        else:
            relative = PurePosixPath(*parts[1:])
            phase = 'entries' if relative.suffix in ('.html', '.webmanifest') else 'resources'
            files.append((info, (phase, relative.as_posix())))
    if len(files) != ZIP_FILES or sum(target is not None for _, target in files) != UPLOAD_FILES:
        raise ValueError(f'发行包必须包含 {ZIP_FILES} 个文件，排除入口后必须为 {UPLOAD_FILES} 个')
    return files


def stage_archive(source, stage):
    records = []
    with zipfile.ZipFile(source) as archive:
        members = archive_members(archive)
        for info, target in members:
            if target is None:
                continue
            phase, relative = target
            destination = stage / phase / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as original, destination.open('xb') as output:
                shutil.copyfileobj(original, output)
            records.append({'phase': phase, 'relative': relative, 'key': f'{PREFIX}/{relative}',
                            'bytes': info.file_size, 'sha256': digest(destination)})
    return sorted(records, key=lambda item: item['key'])


def verify_stage(stage, records):
    expected = {f"{row['phase']}/{row['relative']}": row for row in records}
    if len(expected) != UPLOAD_FILES or any(not allowed_key(row['key']) for row in records):
        raise ValueError('上传清单越界或文件数错误')
    actual = set()
    for path in stage.rglob('*'):
        if path.is_symlink():
            raise ValueError('暂存目录包含软链接')
        if not path.is_file():
            continue
        name = path.relative_to(stage).as_posix()
        actual.add(name)
        row = expected.get(name)
        if row is None or path.stat().st_size != row['bytes'] or digest(path) != row['sha256']:
            raise ValueError(f'暂存文件不在批准清单或内容已改变: {name}')
    if actual != set(expected):
        raise ValueError('暂存文件缺失')


def commands(stage, concurrency):
    common = ['-e', ENV_ID, '--concurrency', str(concurrency), '--retry-count', '3',
              '--retry-interval', '2000', '--verify']
    return [NPX + ['hosting', 'deploy', str(stage / 'resources'), PREFIX] + common,
            NPX + ['hosting', 'deploy', str(stage / 'entries'), PREFIX] + common +
            ['--entry', 'game-v2762.html,game.html']]


def publish(stage, records, concurrency, runner=subprocess.run):
    # A failed resource upload OR remote verification stops before any entry HTML is sent.
    for command in commands(stage, concurrency):
        verify_stage(stage, records)
        print('\n执行: ' + shlex.join(command), flush=True)
        runner(command, check=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--preview', action='store_true', help='只下载、校验和预览清单（默认）')
    mode.add_argument('--deploy', action='store_true', help='上传固定的 471 个仙途文件，同名覆盖')
    parser.add_argument('--zip', type=Path, help='本地未修改的完整发行 ZIP，可避免重新下载')
    parser.add_argument('--work-dir', type=Path, default=Path.cwd() / '.xiantu-deploy-v2868110')
    parser.add_argument('--concurrency', type=int, choices=range(1, 11), default=5, metavar='1..10')
    args = parser.parse_args(argv)
    work = args.work_dir.expanduser().resolve()
    work.mkdir(parents=True, exist_ok=True)
    with (work / 'deploy.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise RuntimeError('同一工作目录已有任务运行，请等它结束。') from error
        source = acquire_zip(work, args.zip)
        with tempfile.TemporaryDirectory(prefix='stage-', dir=work) as temporary:
            stage = Path(temporary)
            records = stage_archive(source, stage)
            verify_stage(stage, records)
            plan = {'version': VERSION, 'environment': ENV_ID, 'destination': PREFIX + '/',
                    'zip_sha256': ZIP_SHA256, 'file_count': len(records),
                    'protected': PROTECTED, 'remote_delete': False, 'files': records}
            manifest = work / 'upload-plan.json'
            manifest.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            resources = sum(row['phase'] == 'resources' for row in records)
            print(f'版本 {VERSION} | 环境 {ENV_ID} | 云端目标 {PREFIX}/')
            print(f'文件 {len(records)} 个：资源 {resources} 个，入口 {len(records)-resources} 个。')
            print('保留远端: ' + ', '.join(PROTECTED))
            print(f'逐文件清单: {manifest}')
            print('同名覆盖；不会清理远端多余文件。')
            if not args.deploy:
                for command in commands(stage, args.concurrency):
                    print('计划命令: ' + shlex.join(command))
                print('预览完成：尚未上传。确认清单后用同样参数加 --deploy 执行。')
                return
            if not shutil.which('node') or not shutil.which('npx'):
                raise RuntimeError('请先安装 Node.js 22 或更新版本（含 npm/npx）。')
            major = int(subprocess.check_output(['node', '-p', 'process.versions.node.split(".")[0]'], text=True).strip())
            if major < 22:
                raise RuntimeError('请使用 Node.js 22 或更新版本。')
            publish(stage, records, args.concurrency)
            print('\n源站上传与 CLI 校验已通过。CDN 缓存仍需在浏览器核对。')
            print(f'仙途入口: {SITE}/{PREFIX}/game-v2762.html?v=2868110')
            print('若仍显示旧版/版本不一致，刷新本次变更的仙途 URL 缓存后重新打开；保留网站数据。')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n已中止；可能有部分文件已上传。重新运行 --deploy 可恢复同一发行包。', file=sys.stderr)
        sys.exit(130)
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        print(f'停止: {error}', file=sys.stderr)
        print('若已开始上传，可能已覆盖部分仙途文件；修复原因后重跑同一命令。没有删除远端文件。', file=sys.stderr)
        sys.exit(1)
