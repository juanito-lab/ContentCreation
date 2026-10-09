#!/usr/bin/env bash
# Check that everything the pipeline needs is installed. Prints one line per item: ok / missing / optional.
#   tools/doctor.sh
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ok() { printf "  ok        %-22s %s\n" "$1" "$2"; }
no() { printf "  MISSING   %-22s %s\n" "$1" "$2"; FAIL=1; }
opt() { printf "  optional  %-22s %s\n" "$1" "$2"; }
FAIL=0
echo "Render"
if command -v node >/dev/null; then v=$(node -v); [ "${v:1:2}" -ge 20 ] 2>/dev/null && ok node "$v" || no node "$v (need 20+)"; else no node "install Node 20+"; fi
command -v ffmpeg >/dev/null && ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3)" || no ffmpeg "brew install ffmpeg / apt install ffmpeg"
ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264 && ok "ffmpeg libx264" "" || no "ffmpeg libx264" "needed for H.264 output"
ffmpeg -hide_banner -filters 2>/dev/null | grep -q zscale && ok "ffmpeg zscale" "HDR -> SDR tone-mapping" || opt "ffmpeg zscale" "only needed for iPhone HDR clips (tools/media_prep.py)"
[ -d "$HERE/studio/node_modules/remotion" ] && ok "studio packages" "" || no "studio packages" "cd studio && npm ci"
if [ -n "${REMOTION_BROWSER:-}" ]; then [ -x "$REMOTION_BROWSER" ] && ok "browser" "REMOTION_BROWSER=$REMOTION_BROWSER" || no browser "REMOTION_BROWSER is not executable"
else ls "$HERE"/studio/node_modules/.remotion/chrome-headless-shell 2>/dev/null | grep -q . && ok browser "Remotion headless shell" || opt browser "run: cd studio && npx remotion browser ensure (or set REMOTION_BROWSER)"; fi
echo "Python"
command -v python3 >/dev/null && ok python3 "$(python3 -V 2>&1 | cut -d' ' -f2)" || no python3 ""
for m in numpy scipy PIL; do python3 -c "import $m" 2>/dev/null && ok "$m" "" || no "$m" "pip install numpy scipy pillow"; done
python3 -c "import pocketsphinx" 2>/dev/null && ok pocketsphinx "offline word times" || no pocketsphinx "pip install pocketsphinx"
python3 -c "import faster_whisper" 2>/dev/null && ok faster-whisper "accurate word times" || opt faster-whisper "pip install faster-whisper"
command -v yt-dlp >/dev/null && ok yt-dlp "$(yt-dlp --version)" || opt yt-dlp "only for tools/grab.sh (pip install yt-dlp)"
echo "Posting"
if [ -n "${ZERNIO_API_KEY:-}" ] || grep -q '^ZERNIO_API_KEY=.\+' "$HERE/.env" 2>/dev/null; then ok "Zernio API key" "set"; else opt "Zernio API key" "cp .env.example .env and fill it in (docs/posting.md)"; fi
[ -f "$HERE/posting.json" ] && ok "posting.json" "" || opt "posting.json" "defaults are used (cp posting.example.json posting.json to change them)"
echo "Profile"
grep -q "REPLACE" "$HERE/CREATOR.md" 2>/dev/null && opt "CREATOR.md" "still has placeholders" || ok "CREATOR.md" ""
[ -f "$HERE/library/LIBRARY.md" ] && ok "library/LIBRARY.md" "" || opt "library/LIBRARY.md" "cp library/LIBRARY.template.md library/LIBRARY.md"
[ "$FAIL" = 0 ] && echo "All required tools are there." || { echo "Some required tools are missing (see MISSING above)."; exit 1; }
