#!/usr/bin/env bash
# Download a reference / related video (Instagram, TikTok, YouTube Shorts, X) + a contact sheet to study its edit.
#   tools/grab.sh <url> [dest-folder]      default dest: refs/
# Output: <dest>/<site>-<id>.mp4, .info.json (caption, author), -sheet.jpg (1 frame every 0.5 s), .wav (for whisper)
# Use downloaded videos as REFERENCE (structure, pacing, hook). Re-posting other people's footage needs their permission.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
URL="$1"; DEST="${2:-$HERE/refs}"; mkdir -p "$DEST"
command -v yt-dlp >/dev/null || { echo "yt-dlp missing: pip install -U yt-dlp"; exit 1; }
F=$(yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --merge-output-format mp4 --write-info-json -o "$DEST/%(extractor)s-%(id)s.%(ext)s" --print after_move:filepath "$URL" | tail -1)
B="${F%.*}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
ROWS=$(python3 -c "import math,sys;print(max(1,math.ceil(float(sys.argv[1])*2/8)))" "$DUR")
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=270:-1,tile=8x$ROWS:padding=4" -frames:v 1 "$B-sheet.jpg"
ffmpeg -v error -y -i "$F" -vn -ac 1 -ar 16000 "$B.wav"
ffprobe -v error -show_entries format=duration -show_entries stream=width,height -of csv=p=0 "$F"
echo "$F"
