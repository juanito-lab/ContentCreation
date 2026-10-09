#!/usr/bin/env bash
# Render one video folder into post-ready files.
#
#   tools/make.sh videos/<id>              full render: mp4 (+ no-music mp4), covers, caption
#   tools/make.sh videos/<id> --preview    fast check (~15 s): one still per scene with safe zones + a contact sheet
#   tools/make.sh videos/<id> --no-check   skip tools/check_spec.py (not recommended)
#
# A video folder holds spec.json (scenes, words, media, post text) plus its media files. Media can also live in
# library/ (shared across videos); the spec just names the file and make.sh finds it.
#
# Output in videos/<id>/out/:
#   <id>_1080x1920.mp4            final, with music if the spec has music
#   <id>_1080x1920_no-music.mp4   only when the spec has music: voice + SFX, so you can add a sound in the app
#   cover-<frame>.png             cover candidates (spec "covers", in frames at 30 fps)
#   caption.txt                   caption + hashtags from spec.post, ready to paste or to post with tools/post.py
#   render.json                   what was rendered: files, sizes, loudness, duration, time
#   preview-*.png, preview-sheet.jpg   (--preview only)
#
# Video: H.264 High, CRF 14, bt709, yuv420p, 30 fps. Audio: AAC 320k 48 kHz, mastered to -14 LUFS (TikTok / Reels
# playback level; at most +10 dB of make-up gain) with a peak limiter at -1.5 dBFS.
# Set REMOTION_BROWSER=/path/to/chrome-headless-shell to use a specific browser (e.g. on servers without Remotion's download).
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
[ -n "${1:-}" ] || { echo "usage: tools/make.sh videos/<id> [--preview] [--no-check]"; exit 1; }
DIR="$(cd "$1" && pwd)"; shift
MODE=""; CHECK=1
for a in "$@"; do
  case "$a" in
    --preview) MODE="--preview" ;;
    --no-check) CHECK=0 ;;
    *) echo "unknown option: $a"; exit 1 ;;
  esac
done
ID="$(basename "$DIR")"
STUDIO="$HERE/studio"
[ -f "$DIR/spec.json" ] || { echo "no spec.json in $DIR"; exit 1; }
for c in node npx python3 ffmpeg ffprobe; do command -v "$c" >/dev/null || { echo "missing: $c (run bash setup.sh)"; exit 1; }; done
BX=()
[ -n "${REMOTION_BROWSER:-}" ] && BX=(--browser-executable="$REMOTION_BROWSER")

# 0. check the spec (errors stop the render, warnings are printed)
[ "$CHECK" = 1 ] && python3 "$HERE/tools/check_spec.py" "$DIR"

# 1. media into studio/public/v/<id>/ (Remotion serves files from public/): the video folder's own files plus any
#    file the spec names that lives in library/
PUB="$STUDIO/public/v/$ID"; rm -rf "$PUB"; mkdir -p "$PUB"
find "$DIR" -maxdepth 1 -type f ! -name 'spec.json' ! -name '*.md' ! -name '.*' -exec cp {} "$PUB/" \;
python3 - "$DIR/spec.json" "$HERE/library" "$PUB" <<'PY'
import json, shutil, sys, os
spec = json.load(open(sys.argv[1])); lib, pub = sys.argv[2], sys.argv[3]
names = [spec.get("voiceover", ""), spec.get("music", "")] + [s["media"]["file"] for s in spec.get("scenes", []) if s.get("media")]
for n in filter(None, names):
    if not os.path.exists(os.path.join(pub, n)) and os.path.exists(os.path.join(lib, n)):
        os.makedirs(os.path.dirname(os.path.join(pub, n)) or pub, exist_ok=True)
        shutil.copy(os.path.join(lib, n), os.path.join(pub, n)); print(f"library: {n}")
PY

# 2. props = spec + base prefix (+ safe zones for previews), caption.txt
OUT="$DIR/out"; mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PROPS="$TMP/props.json"; PROPS_NM="$TMP/props-no-music.json"; PROPS_SZ="$TMP/props-safe.json"
python3 - "$DIR/spec.json" "$ID" "$PROPS" "$PROPS_NM" "$PROPS_SZ" "$OUT/caption.txt" <<'PY'
import json, sys
spec = json.load(open(sys.argv[1])); spec["base"] = f"v/{sys.argv[2]}/"
spec.pop("post", None); spec.pop("covers", None)
json.dump(spec, open(sys.argv[3], "w"))
json.dump({**spec, "music": ""}, open(sys.argv[4], "w"))
json.dump({**spec, "safeZones": True}, open(sys.argv[5], "w"))
post = json.load(open(sys.argv[1])).get("post", {})
tags = " ".join("#" + t.lstrip("#") for t in post.get("hashtags", []))
open(sys.argv[6], "w").write((post.get("caption", "") + ("\n\n" + tags if tags else "")).strip() + "\n")
PY
# preview frame per scene: just after its last word has appeared (all text visible), at least 0.5 s in
read -r TOTAL STARTS < <(python3 -c "
import json,sys
s=json.load(open(sys.argv[1])); acc=0; st=[]
for x in s['scenes']:
    n=round(x['dur']*30); ts=[w.get('t',0) for w in x.get('words',[]) if not w.get('until')]
    st.append(acc+min(n-1, max(15, round(max(ts, default=0)*30)+3))); acc+=n
print(acc, ','.join(map(str,st)))" "$DIR/spec.json")
COVERS=$(python3 -c "import json,sys;print(' '.join(str(c) for c in json.load(open(sys.argv[1])).get('covers',[])))" "$DIR/spec.json")
[ -z "$COVERS" ] && COVERS="15 $((TOTAL/2)) $((TOTAL-20))"

# 3. type-check and bundle once (every still/render below reuses the bundle)
cd "$STUDIO"
npx tsc --noEmit
npx remotion bundle --out-dir="$TMP/bundle" --log=error >/dev/null
BUNDLE="$TMP/bundle"

if [ "$MODE" = "--preview" ]; then
  rm -f "$OUT"/preview-*.png "$OUT/preview-sheet.jpg"
  i=0
  IFS=',' read -ra ST <<< "$STARTS"
  for s in "${ST[@]}"; do
    i=$((i+1)); f=$s; [ "$f" -ge "$TOTAL" ] && f=$((TOTAL-1))
    npx remotion still "$BUNDLE" Short "$OUT/$(printf 'preview-%02d' "$i")-f$f.png" --frame="$f" --props="$PROPS_SZ" "${BX[@]}" --log=error
  done
  for f in $COVERS; do npx remotion still "$BUNDLE" Short "$OUT/preview-cover-$f.png" --frame="$f" --props="$PROPS" "${BX[@]}" --log=error; done
  N=$(ls "$OUT"/preview-*.png | wc -l); COLS=$(( N < 6 ? N : 6 )); ROWS=$(( (N + COLS - 1) / COLS ))
  ffmpeg -v error -y -pattern_type glob -i "$OUT/preview-*.png" -vf "scale=270:-1,tile=${COLS}x${ROWS}:padding=6:color=white" -frames:v 1 "$OUT/preview-sheet.jpg"
  echo "Preview: $N stills in $OUT (one per scene, after its last word appears; red = covered by TikTok/Reels UI), sheet: $OUT/preview-sheet.jpg"
  exit 0
fi

npx remotion render "$BUNDLE" Short "$TMP/picture.mp4" --props="$PROPS" --codec=h264 --image-format=png --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --muted "${BX[@]}" --log=error
npx remotion render "$BUNDLE" Short "$TMP/mix.wav" --props="$PROPS" --codec=wav "${BX[@]}" --log=error
HAS_MUSIC=$(python3 -c "import json,sys;print(1 if json.load(open(sys.argv[1])).get('music') else 0)" "$DIR/spec.json")
[ "$HAS_MUSIC" = 1 ] && npx remotion render "$BUNDLE" Short "$TMP/mix-no-music.wav" --props="$PROPS_NM" --codec=wav "${BX[@]}" --log=error
rm -f "$OUT"/cover-*.png
for f in $COVERS; do npx remotion still "$BUNDLE" Short "$OUT/cover-$f.png" --frame="$f" --props="$PROPS" "${BX[@]}" --log=error; done

lufs() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk -v k="$2:" '$1==k{v=$2} END{print v}'; }
mux() { # $1 wav, $2 out: one gain to reach -14 LUFS (capped at +10 dB), then a limiter catches the peaks
  local I TP G
  I=$(lufs "$1" I); TP=$(lufs "$1" Peak)
  G=$(python3 -c "import sys
I=float(sys.argv[1]) if sys.argv[1] not in ('','-inf') else -70
print(round(min(10.0, -14 - I), 2))" "$I")
  python3 -c "import sys; sys.exit(0 if float(sys.argv[1]) < 10 else 1)" "$G" || echo "warning: the mix is very quiet ($I LUFS); +10 dB is the cap, so the result stays under -14 LUFS"
  ffmpeg -v error -y -i "$TMP/picture.mp4" -i "$1" -map 0:v:0 -map 1:a:0 -c:v copy \
    -af "volume=${G}dB,alimiter=limit=0.841:attack=1:release=50:level=false" -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$2"
  echo "$(basename "$2"): mix $I LUFS / $TP dBTP, gain ${G} dB -> $(lufs "$2" I) LUFS / $(lufs "$2" Peak) dBTP, $(du -h "$2" | cut -f1)"
}
rm -f "$OUT/${ID}_1080x1920.mp4" "$OUT/${ID}_1080x1920_no-music.mp4"
mux "$TMP/mix.wav" "$OUT/${ID}_1080x1920.mp4"
[ "$HAS_MUSIC" = 1 ] && mux "$TMP/mix-no-music.wav" "$OUT/${ID}_1080x1920_no-music.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$OUT/${ID}_1080x1920.mp4"

# 4. render.json: a record of what was made (tools/post.py reads the file list from here)
python3 - "$OUT" "$ID" <<'PY'
import json, os, subprocess, sys, datetime
out, vid = sys.argv[1], sys.argv[2]
def probe(p):
    r = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True).stdout.strip()
    return round(float(r), 3) if r else None
def lufs(p):
    e = subprocess.run(["ffmpeg","-hide_banner","-nostats","-i",p,"-af","ebur128","-f","null","-"],capture_output=True,text=True).stderr
    vals = [l.split()[1] for l in e.splitlines() if l.strip().startswith("I:")]
    return float(vals[-1]) if vals else None
files = []
for n in sorted(os.listdir(out)):
    p = os.path.join(out, n)
    if n.endswith(".mp4"):
        files.append({"file": n, "bytes": os.path.getsize(p), "seconds": probe(p), "lufs": lufs(p)})
    elif n.startswith("cover-") or n == "caption.txt":
        files.append({"file": n, "bytes": os.path.getsize(p)})
json.dump({"id": vid, "renderedAt": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "files": files}, open(os.path.join(out, "render.json"), "w"), indent=1)
PY
echo "Done: $OUT"
