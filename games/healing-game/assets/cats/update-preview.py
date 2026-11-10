#!/usr/bin/env python3
"""Refresh the four embedded preview snapshots from their local GLB files."""

import base64
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import struct
import tempfile


def main():
    root = Path(__file__).resolve().parent
    page = root / 'preview-cat-orange.html'
    cats = ('orange', 'calico', 'black', 'tabby')
    replacements = {}
    # Read and validate every input before touching the existing page.
    for cat in cats:
        data = (root / f'{cat}-cat.glb').read_bytes()
        if len(data) < 20 or struct.unpack_from('<4sII', data) != (b'glTF', 2, len(data)):
            raise ValueError(f'{cat}: invalid GLB header or length')
        length, kind = struct.unpack_from('<II', data, 12)
        if kind != 0x4E4F534A or 20 + length > len(data):
            raise ValueError(f'{cat}: missing or incomplete GLB JSON chunk')
        document = json.loads(data[20:20 + length])
        if document.get('asset', {}).get('version') != '2.0':
            raise ValueError(f'{cat}: expected glTF 2.0')
        replacements[cat] = (hashlib.sha256(data).hexdigest(), base64.b64encode(data).decode('ascii'))

    source = page.read_bytes().decode('utf-8')
    ids = re.findall(r'\bid=["\']cat-model-([^"\']+)["\']', source)
    if sorted(ids) != sorted(cats):
        raise ValueError('Preview must contain exactly one embedded block for each of the four cats')
    block = re.compile(
        r'(<script\s+type="application/octet-stream"\s+id="cat-model-(orange|calico|black|tabby)"'
        r'\s+data-sha256=")([0-9a-f]{64})(">)([A-Za-z0-9+/=\s]*)(</script>)'
    )
    matches = list(block.finditer(source))
    if len(matches) != len(cats):
        raise ValueError('Malformed embedded model block; refusing to alter other markup')
    for match in matches:
        previous = base64.b64decode(re.sub(r'\s+', '', match[5]), validate=True)
        if hashlib.sha256(previous).hexdigest() != match[3]:
            raise ValueError(f'{match[2]}: existing embedded payload does not match its SHA-256')

    def replace(match):
        digest, payload = replacements[match[2]]
        return match[1] + digest + match[4] + payload + match[6]

    updated = block.sub(replace, source).encode('utf-8')
    if updated == source.encode('utf-8'):
        print('Preview already matches all four local GLBs.')
        return
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=root, prefix='.preview-cat-', delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(updated)
        os.chmod(temporary, stat.S_IMODE(page.stat().st_mode))
        os.replace(temporary, page)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(f'Updated four embedded models and hashes in {page.name} ({len(updated)} bytes).')


if __name__ == '__main__':
    main()
