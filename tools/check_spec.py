#!/usr/bin/env python3
"""Check a video spec before rendering (tools/make.sh runs this first).

  python3 tools/check_spec.py videos/<id>            # prints problems, exit 1 on errors
  python3 tools/check_spec.py videos/<id> --quiet    # only print errors and warnings, no summary

Errors (the render would fail or be wrong):
  - spec.json missing or not valid JSON, no scenes, a scene without a positive "dur"
  - a media / voiceover / music file that is neither in the video folder nor in library/
  - more than one scene marked "climax"
Warnings (the render works, but the post will suffer):
  - a word whose box probably reaches into the TikTok / Reels UI areas (see docs/look-and-safe-zones.md)
  - total length under 3 s or over 90 s (Instagram Reels via the API: 3-90 s)
  - voiceover shorter or longer than the scenes by more than 0.5 s
  - more than 5 hashtags (Instagram's limit), #fyp / #viral, a caption without a question
The text-box check is an estimate from font size and character count. The preview stills with safe zones
(tools/make.sh videos/<id> --preview) are the real check.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H = 1080, 1920
SAFE_TOP, SAFE_BOTTOM = 220, H - 450          # text must stay between these y values (px)
RIGHT_X, RIGHT_Y0, RIGHT_Y1 = W - 135, 0.45 * H, 0.80 * H   # right action column
# rough glyph width / size per font (average over lowercase + spaces)
WIDTH_FACTOR = {"sans": 0.48, "serif": 0.42, "sansLight": 0.42, "serifItalic": 0.42, "script": 0.32}
BANNED_TAGS = {"fyp", "foryou", "foryoupage", "viral"}


def find_media(video_dir: Path, name: str) -> Path | None:
    for base in (video_dir, ROOT / "library"):
        p = base / name
        if p.is_file():
            return p
    return None


def duration(path: Path) -> float | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
            capture_output=True, text=True, timeout=30,
        ).stdout.strip()
        return float(out) if out and out != "N/A" else None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def word_box(w: dict) -> tuple[float, float, float, float]:
    """Approximate pixel box (x0, y0, x1, y1) of a word placed by its centre."""
    size = float(w.get("size", 120))
    font = w.get("font", "sans")
    width = len(str(w.get("text", ""))) * size * WIDTH_FACTOR.get(font, 0.5)
    height = size * (1.15 if font == "script" else 1.0)
    cx, cy = float(w.get("x", 50)) / 100 * W, float(w.get("y", 20)) / 100 * H
    return cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2


def check(video_dir: Path) -> tuple[list[str], list[str], dict]:
    errors: list[str] = []
    warnings: list[str] = []
    spec_path = video_dir / "spec.json"
    if not spec_path.is_file():
        return [f"no spec.json in {video_dir}"], [], {}
    try:
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"spec.json is not valid JSON: {e}"], [], {}

    scenes = spec.get("scenes") or []
    if not scenes:
        errors.append('"scenes" is empty')
    total = 0.0
    frames = 0
    climaxes = 0
    for i, s in enumerate(scenes, 1):
        label = f'scene {i} "{s.get("name", "")}"'.replace(' ""', "")
        dur = s.get("dur")
        if not isinstance(dur, (int, float)) or dur <= 0:
            errors.append(f'{label}: "dur" must be a positive number of seconds')
            continue
        total += dur
        frames += round(dur * 30)
        climaxes += bool(s.get("climax"))
        media = s.get("media")
        if media:
            f = media.get("file", "")
            if not f:
                errors.append(f'{label}: media has no "file"')
            elif not find_media(video_dir, f):
                errors.append(f"{label}: media file not found in the video folder or library/: {f}")
        for w in s.get("words", []):
            t = w.get("t", 0)
            if t > dur:
                warnings.append(f'{label}: word "{w.get("text")}" starts at {t} s, after the scene ends ({dur} s)')
            x0, y0, x1, y1 = word_box(w)
            where = []
            if y0 < SAFE_TOP:
                where.append("top bar")
            if y1 > SAFE_BOTTOM:
                where.append("bottom caption area")
            if x1 > RIGHT_X and y1 > RIGHT_Y0 and y0 < RIGHT_Y1:
                where.append("right button column")
            if x0 < 0 or x1 > W:
                where.append("outside the frame")
            if where:
                warnings.append(f'{label}: word "{w.get("text")}" probably reaches into the {", ".join(where)}')
    if climaxes > 1:
        errors.append(f"{climaxes} scenes have climax: true; use it on one scene only")

    for key in ("voiceover", "music"):
        f = spec.get(key, "")
        if f and not find_media(video_dir, f):
            errors.append(f'{key} file not found in the video folder or library/: {f}')
    vo = spec.get("voiceover", "")
    vo_path = find_media(video_dir, vo) if vo else None
    if vo_path:
        d = duration(vo_path)
        if d is not None and abs(d - total) > 0.5:
            warnings.append(f"voiceover is {d:.2f} s but the scenes add up to {total:.2f} s; re-time the scene durations")

    if total and total < 3:
        warnings.append(f"total length {total:.1f} s is under 3 s (TikTok and Reels minimum)")
    if total > 90:
        warnings.append(f"total length {total:.1f} s is over 90 s (Instagram Reels via the API allows 3-90 s)")

    post = spec.get("post") or {}
    tags = [t.lstrip("#").lower() for t in post.get("hashtags", [])]
    if len(tags) > 5:
        warnings.append(f"{len(tags)} hashtags: Instagram allows at most 5; TikTok works best with 3-4")
    bad = sorted(set(tags) & BANNED_TAGS)
    if bad:
        warnings.append(f"drop {', '.join('#' + b for b in bad)}: there is no evidence they help")
    caption = post.get("caption", "")
    if caption and "?" not in caption:
        warnings.append("caption has no question; ending on a question invites comments")
    if not caption:
        warnings.append('no "post.caption" set; caption.txt will be empty')

    return errors, warnings, {"scenes": len(scenes), "seconds": round(total, 2), "frames": frames}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video_dir", type=Path)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()
    errors, warnings, info = check(a.video_dir.resolve())
    for e in errors:
        print(f"ERROR   {e}")
    for w in warnings:
        print(f"warning {w}")
    if info and not a.quiet:
        print(f"spec ok: {info['scenes']} scenes, {info['seconds']} s ({info['frames']} frames)" if not errors else "spec has errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
