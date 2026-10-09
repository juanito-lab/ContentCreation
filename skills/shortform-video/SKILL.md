---
name: shortform-video
description: "Make a short vertical video (TikTok / Instagram Reels) with the ContentCreation repo: turn a reference reel, related content, clips or an idea into a script and a JSON spec, time it to the creator's recorded voice, check preview stills against the platform safe zones, render with Remotion (automatic sound design, -14 LUFS, covers, caption) and get the creator's approval. Use when the creator sends a reference link, clips or a topic, or says 'make a video / reel / tiktok'."
version: 3.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [Remotion, Video, TikTok, Reels, Instagram, Shortform, Edit]
    related_skills: [post-video]
---

# Short-form video: reference → script → voice → spec → stills → render → approval

Workspace: the root of the ContentCreation repo (`studio/`, `tools/`, `videos/`, `library/`, `docs/`).

**Read first, every time:** `CREATOR.md` (whose account, voice and fact rules, who approves), `library/LIBRARY.md`
(media already on disk, if it exists), and `docs/workflow.md` (the fast path with reasons). Details per topic are in
`docs/` (`spec-reference.md`, `voiceover.md`, `sound-and-music.md`, `look-and-safe-zones.md`, `media.md`).

Target: **under 2 hours** for a 30–40 s video, most of it the creator's recording time. The first video made with
this repo took 11.5 hours; the rules below are what cut that.

## Five rules (each one cost hours when broken)

1. **Voice first.** The creator records in voice-coach (max 3 takes) before any timing work. Never time a video to a
   guide or TTS voice: every beat has to be re-fitted later.
2. **Spec, not code.** Build from `videos/<id>/spec.json` + the `Short` composition. If a beat type is missing, add it
   to `studio/src/Short.tsx` once as a reusable scene option. Never write a new per-video composition.
3. **One reference per video**, fixed before anything is built.
4. **Stills before the full render.** `tools/make.sh videos/<id> --preview` and look at every still (safe zones on).
   The creator approves the stills and the hook before the full render.
5. **Render where the files live** (the creator's machine or the agent server), straight into `videos/<id>/out/`.
   No tarball round trips.

## The loop

1. **Intake (one message).** Ask for: the reference link, the 3–6 story points, which new clips are in `library/inbox/`.
   - Reference: `tools/grab.sh <url>` → `refs/<site>-<id>.mp4`, `.info.json`, `-sheet.jpg` (2 fps contact sheet), `.wav`.
     Look at the sheet, read the caption, run `python3 tools/words.py refs/<file>.wav` for the spoken words and times.
   - Write down the reference's structure: hook (first 1.5 s), number of scenes, cut rhythm, where text sits, the climax.
2. **Script + caption.** Same structure and pacing, the creator's own story and numbers. One line per beat, ~3 words per
   second (~40 words per 15 s). Every line carries a number or a mechanism. Strongest image and line first. Caption
   ends with a question, 3–5 specific hashtags. Send hook + lines + caption and wait for "ok".
3. **Voice.** The creator records the approved script in voice-coach and downloads the best take's `.wav` and
   `.lines.json`. Then:
   ```bash
   python3 tools/voice_assemble.py take.wav videos/<id>/vo.wav videos/<id>/plan.json take.lines.json 1.08 0.22 0.22
   python3 tools/words.py videos/<id>/vo.wav > videos/<id>/words.json
   ```
   (No voice-coach timing file? `python3 tools/voice_chunks.py take.webm --words` maps the take; build lines.json from it.)
4. **Folder + spec.** `tools/new_video.sh <YYYY-MM-DD-slug>`. Media: the video folder or `library/` (spec names the file).
   Scene `dur` = gap between line starts in `plan.json`; each word's `t` = its time in `words.json` minus the scene start.
   The scene durations must add up to the voiceover length (`check_spec.py` warns otherwise).
5. **Preview.** `tools/make.sh videos/<id> --preview` → one still per scene (after its last word appears) with the
   safe zones in red, plus `preview-sheet.jpg`. Look at every still yourself: text inside the safe area, nothing
   overlapping, readable over footage, no empty or black frame. Fix, re-preview, then send the sheet + hook to the creator.
6. **Render.** `tools/make.sh videos/<id>` → `out/<id>_1080x1920.mp4` (+ `_no-music.mp4` when the spec has music),
   `cover-*.png`, `caption.txt`, `render.json`. About 1 minute per 10 s of video on a laptop.
7. **QA + approval.** If a QA reviewer agent exists, post the mp4, cover and caption to it first. Then send the creator
   the video, the cover and the exact caption. **Nothing is posted until the creator says "yes" to that exact file and
   caption.** Posting: the `post-video` skill.

## Spec in one screen

```jsonc
{
  "voiceover": "vo.wav", "voVolume": 0.6,       // voice sits lower than you think
  "music": "", "musicVolume": 0.15,             // "" = add a sound in the app later
  "sfxVolume": 1.3, "autoSfx": true,
  "theme": { "bg": "#ffffff", "ink": "#000000", "accent": "#E10600", "accent2": "#12b76a" },
  "scenes": [
    { "name": "Hook", "dur": 2.4,
      "media": { "file": "hook.mp4", "startSec": 1.0, "layout": "full", "zoom": 1.08, "origin": "50% 30%" },
      "words": [ { "t": 0.1, "text": "I left Zürich", "font": "sans", "size": 150, "x": 50, "y": 30 },
                 { "t": 1.0, "text": "dream", "font": "script", "size": 300, "x": 50, "y": 42, "color": "#E10600" } ] },
    { "name": "Number", "dur": 3.0, "counter": { "t": 0.4, "to": 760, "prefix": "$", "suffix": "/day", "y": 48 } },
    { "name": "Payoff", "dur": 3.5, "climax": true, "words": [ ... ] }
  ],
  "covers": [20, 150],
  "post": { "caption": "... ending on a question?", "hashtags": ["buildinpublic", "startup"] }
}
```

Layouts: `full` (full-bleed 9:16, white text with shadow), `inset` (16:9 card), `tall` (4:5 card, for people).
Fonts: `sans`, `serif`, `script`. Positions are % of the frame, x/y = centre of the word.
**Text-safe area: y 220–1470 px (11.5%–76.5%), x up to 945 px (87.5%) between 45% and 80% of the height.**
Every field: `docs/spec-reference.md`.

## Never

- Invent numbers, claims or names. Facts only from the creator or their notes (`CREATOR.md`).
- Use another creator's footage, audio, handle or watermark. Their reel is a reference only.
- Post, schedule or upload anything without the creator's "yes" to the exact file and caption.
- Report in paragraphs. One line per step; at the end: what was made, what was checked, what is open.
