#!/usr/bin/env bash
# Create a new video folder from the template.
#   tools/new_video.sh <id>        id like 2026-10-09-first-pilot (lowercase letters, digits, dashes)
# Then: put the voiceover and clips in videos/<id>/ (or in library/), edit videos/<id>/spec.json,
# and check it with: tools/make.sh videos/<id> --preview
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
[ -n "${1:-}" ] || { echo "usage: tools/new_video.sh <id>   (e.g. $(date +%F)-my-video)"; exit 1; }
[[ "$1" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "id must be lowercase letters, digits and dashes: $1"; exit 1; }
D="$HERE/videos/$1"; [ -e "$D" ] && { echo "exists: $D"; exit 1; }
mkdir -p "$D" && cp "$HERE/videos/_template/spec.json" "$D/" && echo "$D"
