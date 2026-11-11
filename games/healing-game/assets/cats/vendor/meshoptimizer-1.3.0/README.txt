meshoptimizer 1.3.0 — official decoder/authoring encoder (MIT)
Source: https://registry.npmjs.org/meshoptimizer/-/meshoptimizer-1.3.0.tgz
Upstream: https://github.com/zeux/meshoptimizer
Tarball SHA256: 6c3e8d653702333ce392cfa377065a9e38531285b74721d7ceffea53e025252b

Unmodified vendored files:
- meshopt_decoder.cjs: browser global MeshoptDecoder and CommonJS export.
  29,360 bytes; SHA256 fabafaaa29cbb1cfa367f20e896d7f6e95b86e575e2ea86ddb6f8cca1a87152d
- meshopt_decoder.mjs: same official decoder for Node authoring/audits.
- meshopt_encoder.js: build-time encoder only; never shipped in the game page.
- LICENSE.md: upstream MIT license.

build.py inlines the CJS decoder, including its embedded WASM, in index.html.
There are no external decoder or WASM requests. Preview CSP allows only
wasm-unsafe-eval for this WASM instantiation; it does not allow JavaScript eval.
The six-file game package remains index.html, MP3 and four GLBs.

The encoder uses EXT_meshopt_compression v0, filter NONE and index mode INDICES.
Every encoded view is decoded and compared byte-for-byte during authoring.
Bounded attribute quantization is a separate, recorded precompression step;
original JPEG texture bytes are never recompressed by the Walk pipeline.
