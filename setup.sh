#!/usr/bin/env bash
# One-time setup on the machine that renders (Hostinger Hermes container, a Linux VPS, or a Mac).
#   bash setup.sh
# Installs: ffmpeg, Node deps for the Remotion studio, Chrome Headless Shell (Remotion's renderer),
# yt-dlp (grab reference videos), faster-whisper (word timings). Then renders 3 preview stills as a smoke test.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SUDO=""; [ "$(id -u)" != 0 ] && command -v sudo >/dev/null && SUDO="sudo"

if [ "$(uname)" = "Darwin" ]; then
  command -v brew >/dev/null && brew install ffmpeg node yt-dlp && python3 -m pip install -U pocketsphinx numpy scipy pillow || echo "Install Homebrew, then: brew install ffmpeg node yt-dlp && python3 -m pip install -U pocketsphinx numpy scipy pillow"
else
  $SUDO apt-get update -y
  $SUDO apt-get install -y ffmpeg python3 python3-pip git curl ca-certificates \
    libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libasound2 libxrandr2 libxkbcommon0 libxfixes3 \
    libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji || \
  $SUDO apt-get install -y ffmpeg python3 python3-pip git curl ca-certificates libnss3 libdbus-1-3 libatk1.0-0 \
    libatk-bridge2.0-0 libgbm1 libasound2t64 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2
  if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash - && $SUDO apt-get install -y nodejs
  fi
  python3 -m pip install -U yt-dlp pocketsphinx numpy scipy pillow --break-system-packages 2>/dev/null || python3 -m pip install -U yt-dlp pocketsphinx numpy scipy pillow
fi

cd "$HERE/studio" && npm ci --no-audit --no-fund && npx remotion browser ensure
git -C "$HERE" submodule update --init --depth 1 kit 2>/dev/null || [ -d "$HERE/kit/.git" ] || git clone --depth 1 https://github.com/JasperKallfelz/shortform-edit-kit "$HERE/kit" || true
mkdir -p "$HERE/refs"
cd "$HERE" && tools/make.sh videos/example --preview && echo "Setup OK. Next: tools/new_video.sh <id>"
