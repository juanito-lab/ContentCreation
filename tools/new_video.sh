#!/usr/bin/env bash
# Create a new video folder from the template:  tools/new_video.sh <id>   (id like 2026-10-09-first-pilot)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
[ -n "${1:-}" ] || { echo "usage: tools/new_video.sh <id>"; exit 1; }
D="$HERE/videos/$1"; [ -e "$D" ] && { echo "exists: $D"; exit 1; }
mkdir -p "$D" && cp "$HERE/videos/_template/spec.json" "$D/" && echo "$D"
