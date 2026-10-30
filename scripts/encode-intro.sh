#!/usr/bin/env bash
# Run from repository root. Preserve the original; produce only one small phone variant.
set -euo pipefail
src="${1:-xiantu-v2831-scroll/intro-v2860.mp4}"
out="${2:-xiantu-v2831-scroll}"
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
mkdir -p "$out"
ffmpeg -v error -y -i "$src" -vf scale=640:360 -c:v libx264 -profile:v main -level 3.0 -preset slow -crf 28 -maxrate 700k -bufsize 1400k -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart "$out/intro-v286891-360.mp4"
ffmpeg -v error -y -ss 1.9 -i "$src" -frames:v 1 -q:v 5 "$out/intro-poster-v286891.jpg"
ffmpeg -v error -y -ss 5.6 -i "$src" -frames:v 1 -q:v 5 "$out/boot-bg-v286891.jpg"
ffprobe -v error -show_entries format=size,duration:stream=codec_name,width,height -of json "$out/intro-v286891-360.mp4"
