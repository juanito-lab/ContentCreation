#!/usr/bin/env bash
# Render one video folder into post-ready files.
#
#   tools/make.sh videos/<id>            full render (both versions + covers)
#   tools/make.sh videos/<id> --preview  3 stills only (fast check before a full render)
#
# A video folder holds spec.json (scenes, words, media, post text) plus its media files.
# Output in videos/<id>/out/:
#   <id>_1080x1920.mp4            final, with music if the spec has music
#   <id>_1080x1920_no-music.mp4   voice + SFX only (add a song from the in-app library = no copyright risk)
#   cover-<frame>.png             cover candidates
#   caption.txt                   caption + hashtags from spec.post, ready to paste / to post
# Video: H.264 High, CRF 14, bt709, 30 fps. Audio: AAC 320k, linear gain down to max -14 LUFS / -1.2 dBTP (never louder).
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$(cd "$1" && pwd)"; MODE="${2:-}"
ID="$(basename "$DIR")"
STUDIO="$HERE/studio"
[ -f "$DIR/spec.json" ] || { echo "no spec.json in $DIR"; exit 1; }
BX=()
[ -n "${REMOTION_BROWSER:-}" ] && BX=(--browser-executable="$REMOTION_BROWSER")

# 1. media into studio/public/v/<id>/ (Remotion serves files from public/)
PUB="$STUDIO/public/v/$ID"; rm -rf "$PUB"; mkdir -p "$PUB"
find "$DIR" -maxdepth 1 -type f ! -name 'spec.json' ! -name '*.md' -exec cp {} "$PUB/" \;

# 2. props = spec + base prefix
OUT="$DIR/out"; mkdir -p "$OUT"
PROPS="$OUT/.props.json"; PROPS_NM="$OUT/.props-no-music.json"
python3 - "$DIR/spec.json" "$ID" "$PROPS" "$PROPS_NM" "$OUT/caption.txt" <<'PY'
import json, sys
spec = json.load(open(sys.argv[1])); spec["base"] = f"v/{sys.argv[2]}/"
json.dump(spec, open(sys.argv[3], "w"))
json.dump({**spec, "music": ""}, open(sys.argv[4], "w"))
post = spec.get("post", {})
tags = " ".join("#" + t.lstrip("#") for t in post.get("hashtags", []))
open(sys.argv[5], "w").write((post.get("caption", "") + ("\n\n" + tags if tags else "")).strip() + "\n")
PY
TOTAL=$(python3 -c "import json,sys;print(sum(round(s['dur']*30) for s in json.load(open(sys.argv[1]))['scenes']))" "$DIR/spec.json")
COVERS=$(python3 -c "import json,sys;s=json.load(open(sys.argv[1]));print(' '.join(str(c) for c in s.get('covers',[]) ) or '')" "$DIR/spec.json")
[ -z "$COVERS" ] && COVERS="15 $((TOTAL/2)) $((TOTAL-20))"

cd "$STUDIO"
npx tsc --noEmit
if [ "$MODE" = "--preview" ]; then
  for f in $COVERS; do npx remotion still Short "$OUT/preview-$f.png" --frame="$f" --props="$PROPS" "${BX[@]}" --log=error; done
  echo "Preview stills: $OUT/preview-*.png"; exit 0
fi

TMP="$(mktemp -d)"
npx remotion render Short "$TMP/picture.mp4" --props="$PROPS" --codec=h264 --image-format=png --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --muted "${BX[@]}" --log=error
npx remotion render Short "$TMP/mix.wav" --props="$PROPS" --codec=wav "${BX[@]}" --log=error
HAS_MUSIC=$(python3 -c "import json,sys;print(1 if json.load(open(sys.argv[1])).get('music') else 0)" "$DIR/spec.json")
[ "$HAS_MUSIC" = 1 ] && npx remotion render Short "$TMP/mix-no-music.wav" --props="$PROPS_NM" --codec=wav "${BX[@]}" --log=error
for f in $COVERS; do npx remotion still Short "$OUT/cover-$f.png" --frame="$f" --props="$PROPS" "${BX[@]}" --log=error; done

lufs() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk -v k="$2:" '$1==k{v=$2} END{print v}'; }
mux() { # $1 wav, $2 out
  local I TP G
  I=$(lufs "$1" I); TP=$(lufs "$1" Peak)
  G=$(python3 -c "import sys,math
I=float(sys.argv[1]) if sys.argv[1] not in ('','-inf') else -70; TP=float(sys.argv[2]) if sys.argv[2] not in ('','-inf') else -70
print(round(min(0,-14-I,-1.2-TP),2))" "$I" "$TP")
  ffmpeg -v error -y -i "$TMP/picture.mp4" -i "$1" -map 0:v:0 -map 1:a:0 -c:v copy -af "volume=${G}dB" -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$2"
  echo "$(basename "$2"): mix $I LUFS / $TP dBTP, gain ${G} dB -> $(lufs "$2" I) LUFS, $(du -h "$2" | cut -f1)"
}
mux "$TMP/mix.wav" "$OUT/${ID}_1080x1920.mp4"
[ "$HAS_MUSIC" = 1 ] && mux "$TMP/mix-no-music.wav" "$OUT/${ID}_1080x1920_no-music.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$OUT/${ID}_1080x1920.mp4"
rm -rf "$TMP" "$PROPS" "$PROPS_NM"
echo "Done: $OUT"
