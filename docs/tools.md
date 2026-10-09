# Tools reference

Every tool prints its usage with `-h` (Python) or without arguments (shell). Paths are relative to the repo root.

## Setup and checks

| Command | What it does |
|---|---|
| `bash setup.sh [--whisper]` | Installs everything (Homebrew or apt, Node 22, Python libs, yt-dlp, studio packages, Remotion's Chrome), creates `library/` and `refs/`, renders a smoke test. `--whisper` adds faster-whisper. |
| `tools/doctor.sh` | One line per dependency: `ok`, `MISSING` (required) or `optional`. Exit 1 if something required is missing. |

## Make a video

| Command | What it does |
|---|---|
| `tools/new_video.sh <id>` | Creates `videos/<id>/` with the template `spec.json`. Ids: lowercase, digits, dashes (e.g. `2026-10-12-first-pilot`). |
| `python3 tools/check_spec.py videos/<id>` | Validates a spec: errors (missing files, no scenes, two climaxes) and warnings (text in UI areas, length outside 3–90 s, voice vs. scene length, hashtags, caption without a question). Exit 1 on errors. |
| `tools/make.sh videos/<id> --preview` | Check + one still per scene (just after its last word appears) with safe zones, the cover frames, and `preview-sheet.jpg`. ~15 s. |
| `tools/make.sh videos/<id>` | Check + full render: mp4 (−14 LUFS master), `_no-music.mp4` if the spec has music, `cover-*.png`, `caption.txt`, `render.json`. |
| `tools/make.sh videos/<id> --no-check` | Skip the spec check. |

`make.sh` copies the video folder's files and any `library/` files the spec names into `studio/public/v/<id>/`, bundles the studio once, and reuses the bundle for every still and render. Set `REMOTION_BROWSER` to use a specific Chrome headless shell.

## Voice

| Command | What it does |
|---|---|
| `python3 tools/voice_chunks.py take.webm [--words] [--noise -32] [--min-pause 0.18]` | Maps a raw take: speech chunks between pauses, a rough offline transcript per chunk (PocketSphinx), optional word start times. Use it to build `lines.json` when you have no voice-coach timing file. |
| `python3 tools/voice_assemble.py raw.wav out.wav plan.json lines.json [tempo] [maxgap] [tail]` | Cleans, levels (−16 LUFS), speeds up, assembles the chunks in script order, caps pauses, adds stutters; writes the voiceover and `plan.json` (line starts + time map). Accepts voice-coach's `.lines.json` or full timing `.json`. |
| `python3 tools/words.py audio.wav [--engine auto\|whisper\|sphinx] [--model small] [--lang en]` | Word timestamps as JSON `[{"w", "t", "end"}]`. faster-whisper when installed, else PocketSphinx. |

## Media

| Command | What it does |
|---|---|
| `tools/grab.sh <url> [dest]` | Downloads a reference (Instagram, TikTok, YouTube Shorts, X) with yt-dlp to `refs/`: the mp4, `.info.json`, a 2 fps contact sheet `-sheet.jpg`, a 16 kHz `.wav`. |
| `python3 tools/contact_sheet.py SRC_DIR OUT_PREFIX [--tile 240] [--per 60]` | Numbered contact sheets of a folder of photos/videos, plus `OUT_PREFIX-list.txt` (number → file). |
| `python3 tools/media_prep.py SRC_DIR OUT_DIR jobs.json` | Phone originals → edit media: EXIF rotation, HDR → SDR only when the clip is HDR, cuts, 1080 px, 30 fps, H.264, no audio. |

## Sound

| Command | What it does |
|---|---|
| `python3 tools/music_bed.py out.wav total climax build works outro` | An original synthesized music bed (120 BPM, A minor) with a downbeat on the climax. |
| `python3 tools/sfx_plane.py out.wav [duration] [whoosh.wav]` | A synthesized jet flyby (example of building a missing sound; recordings sound better). |

## Post

| Command | What it does |
|---|---|
| `python3 tools/post.py accounts` | Lists the social accounts connected to your Zernio account. |
| `python3 tools/post.py approve videos/<id> [--file X.mp4] [--by NAME] [--yes]` | Shows the file and exact caption, records an approval tied to their SHA-256 hashes. |
| `python3 tools/post.py publish videos/<id> --to instagram,tiktok [--now \| --at TIME \| --draft] [--dry-run] [--tz ZONE] [--file X.mp4] [--tiktok-privacy LEVEL] [--config FILE]` | Without a mode: plan only. Refuses unless the approval matches. |
| `python3 tools/post.py status <post-id>` | Status and URLs per platform. |

## Studio

| Command (in `studio/`) | What it does |
|---|---|
| `npm run dev` | Remotion Studio on http://localhost:3000: preview compositions, edit props live. |
| `npx remotion still Short out.png --frame=60 --props=spec.json` | One frame of a spec (add `"safeZones": true` to the props to see the UI areas). |
| `npm run lint` | ESLint + TypeScript. |

## Tests

```bash
python3 -m unittest discover -s tools/tests -v     # post.py and check_spec.py, no network
cd studio && npm run lint                          # studio code
```
