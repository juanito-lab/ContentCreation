#!/usr/bin/env bash
# One-time setup on the machine that renders: a Mac, a Linux VPS, or an agent's container (e.g. Hermes).
#
#   bash setup.sh             ffmpeg, Node 22, Python libs (numpy, scipy, pillow, pocketsphinx), yt-dlp,
#                             the Remotion studio's npm packages and Remotion's headless Chrome; then a smoke test
#   bash setup.sh --whisper   also installs faster-whisper (more accurate word timings; downloads a model on first use)
#
# Safe to run again. Afterwards run tools/doctor.sh to see what is installed and what is missing.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WHISPER=0; [ "${1:-}" = "--whisper" ] && WHISPER=1
PY_PKGS="numpy scipy pillow pocketsphinx yt-dlp"; [ "$WHISPER" = 1 ] && PY_PKGS="$PY_PKGS faster-whisper"
SUDO=""; [ "$(id -u)" != 0 ] && command -v sudo >/dev/null && SUDO="sudo"

echo "==> system packages"
if [ "$(uname)" = "Darwin" ]; then
  command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
  brew install ffmpeg node
  python3 -m pip install -U $PY_PKGS || python3 -m pip install -U --user $PY_PKGS
else
  $SUDO apt-get update -y
  # Chrome headless shell needs these libraries; the second list is for Ubuntu 24.04+ (libasound2t64)
  LIBS="libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2"
  $SUDO apt-get install -y ffmpeg python3 python3-pip git curl ca-certificates fonts-noto-color-emoji $LIBS libasound2 || \
    $SUDO apt-get install -y ffmpeg python3 python3-pip git curl ca-certificates $LIBS libasound2t64
  if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash - && $SUDO apt-get install -y nodejs
  fi
  python3 -m pip install -U $PY_PKGS --break-system-packages 2>/dev/null || python3 -m pip install -U $PY_PKGS
fi

echo "==> Remotion studio"
cd "$HERE/studio" && npm ci --no-audit --no-fund
if ! npx remotion browser ensure; then
  echo "Could not download Remotion's headless Chrome. Point REMOTION_BROWSER at a Chrome/Chromium headless shell instead,"
  echo "e.g.  export REMOTION_BROWSER=/path/to/chrome-headless-shell"
fi

echo "==> folders"
mkdir -p "$HERE/refs" "$HERE/library/inbox"
[ -f "$HERE/library/LIBRARY.md" ] || cp "$HERE/library/LIBRARY.template.md" "$HERE/library/LIBRARY.md"
[ -f "$HERE/.env" ] || echo "Posting: cp .env.example .env and add your ZERNIO_API_KEY (see docs/posting.md)"

echo "==> smoke test (3 preview stills of videos/example)"
cd "$HERE" && tools/make.sh videos/example --preview
echo "Setup OK. Next: tools/doctor.sh, then docs/getting-started.md"
