---
name: shortform-video
description: "Make short vertical videos (TikTok / Instagram Reels) for Juan's personal account @juansimon.builds with the Video Studio: turn a reference video, related content, clips or an idea into a JSON spec, render it with Remotion (auto sound design, -14 LUFS, covers, caption), and hand Juan a preview for approval. Use when Juan sends a reference link, clips, a topic or says 'make a video / reel / tiktok'."
version: 2.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [Remotion, Video, TikTok, Reels, Instagram, Shortform, Edit]
    related_skills: [clip-sound-post-flow, reference-to-social-post-flow]
---

# Shortform video: idea / reference -> spec -> render -> Juan approves

Workspace: the `ContentCreation` repo (github.com/juanito-lab/ContentCreation): `studio/`, `tools/`, `videos/`, `kit/`.
**Read `docs/LEARNINGS.md` before starting**: it has the hard-won rules (safe zones, voice pipeline, HDR, fonts, delivery).
Background on sound design, export and retention research (German): `kit/edit-tools/README.md`, `kit/docs/recherche-2026-10.md`.

Account: **@juansimon.builds** (Juan's personal founder account, Instagram now, TikTok soon). Voice: founder building MantAI
in public. Juan does not want to film from scratch: most videos start from **related content he found** (a reference video
or link) and get rebuilt with his own words, numbers and clips.

## The loop

1. **Intake.** Juan sends a link, clips, a screenshot or a topic.
   - Link: `tools/grab.sh <url>` -> `refs/<site>-<id>.mp4`, `.info.json`, `-sheet.jpg` (2 fps contact sheet), `.wav`.
     Look at the sheet, read the caption, run `python3 tools/words.py refs/<file>.wav` for the spoken words + timings.
   - Write down the reference's structure: hook (first 1.5 s), number of scenes, cut rhythm, where text sits, the climax.
2. **Script.** Write the new version for @juansimon.builds: same structure and pacing, Juan's own story/numbers.
   ~40 words per 15 s. Every line carries a number or a mechanism, no fluffy metaphors. Strongest image/line first.
   Send Juan the script (hook + lines + caption) and wait for "ok" before rendering a full video.
3. **Folder.** `tools/new_video.sh <YYYY-MM-DD-slug>` -> `videos/<id>/spec.json`. Put media in the same folder
   (clips, images, `vo.wav`, music). Never re-use another creator's footage in the final video without permission:
   their video is the *reference*, the footage is Juan's (or generated text/number scenes).
4. **Spec.** Edit `spec.json` (schema below). If there is a voiceover: `python3 tools/words.py videos/<id>/vo.wav`,
   then set each scene `dur` and each word `t` from the timings (t is relative to its scene start).
5. **Preview.** `tools/make.sh videos/<id> --preview` -> 3 stills in `out/`. Look at them yourself (text inside the
   frame? overlapping? readable over video?) and fix before going on.
6. **Render.** `tools/make.sh videos/<id>` -> `out/<id>_1080x1920.mp4` (+ `_no-music.mp4` if music is set),
   `cover-*.png`, `caption.txt`. ~3-4 min per 15 s on a small server.
7. **QA + approval.** Post the mp4, cover and caption to #qa-review, then send Juan the video + QA verdict.
   **Nothing is posted until Juan says "yes" to that exact file and caption.** Posting is set up separately (later).

## Spec schema (`videos/<id>/spec.json`)

```jsonc
{
  "voiceover": "vo.wav",          // file in the video folder, "" = none
  "music": "",                    // prefer "" and add a song in-app (IG/TikTok library = no copyright strikes)
  "musicVolume": 0.15, "sfxVolume": 1.3, "autoSfx": true,
  "theme": { "bg": "#ffffff", "ink": "#000000", "accent": "#e1251b", "accent2": "#12b76a" },
  "scenes": [
    {
      "name": "Hook", "dur": 2.5,           // seconds
      "bg": "#ffffff",                       // optional, per scene
      "media": { "file": "clip1.mp4", "startSec": 3.2,
                 "layout": "full",          // full = full-bleed 9:16 (white text + shadow), inset = 16:9 card, tall = 4:5 card
                 "top": 40, "zoom": 1.08, "origin": "50% 30%", "sound": false },
      "words": [ { "t": 0.1, "text": "I quit my job", "font": "sans", "size": 140, "x": 50, "y": 18, "color": "#e1251b" } ],
      "counter": { "t": 0.4, "to": 760, "prefix": "$", "suffix": "/day", "y": 48, "mode": "land" },
      "climax": false,                       // true on ONE scene: music dips before it, riser + drum on the cut
      "sfx": [ { "t": 1.2, "s": "shutterBurst3", "vol": 0.06 } ]   // extra cues, names from studio/src/lib/sfx.tsx
    }
  ],
  "covers": [20, 150],                       // frames to export as cover candidates (30 fps)
  "post": { "caption": "...", "hashtags": ["buildinpublic", "startup"] }
}
```

Fonts: `sans` (heavy Inter), `sansLight`, `serifItalic` (Playfair), `script` (Pinyon, big and red works as the accent word).
Positions are % of the frame (x, y = centre). Keep text inside y 8-85 (UI covers the bottom on both apps) and x 8-92.
Typical sizes: line 80-90, punch word 140-180, script word 280-400.

Automatic sound (from the kit, real recordings only): key tap per word, pencil on script words, shutter when media appears,
page flip on cuts, flaps on counters, riser + drum into the climax. Add more with `sfx`; never louder than the music.


## Voice-over pipeline (Juan records with voice-coach → .webm)

1. `python3 tools/voice_chunks.py take.webm --words`: chunks, rough offline transcript, word times. Map the chunks to
   script lines and drop retakes (keep the last clean one).
2. Pick the take: loudest and cleanest (I ≥ −20 LUFS, noise floor ≤ −55 dB) among the ones Juan likes.
3. `python3 tools/voice_assemble.py take.wav vo.wav plan.json lines.json 1.08 0.22 0.22`: clean, level to −16 LUFS,
   +8% tempo (same pitch), pauses ≤ 0.22 s, optional stutter slices.
4. Retime the composition from `plan.json`: beat lengths = gaps between line starts; text pops and card swaps at
   mapped word times. Every cut lands on a word.
5. Mix: voice volume about 0.6, music bed about 0.3, master the final file to −14 LUFS / −1 dBTP. Juan found voice at
   1.0 "way too loud".

## Look and sound checklist

- Safe zones: render stills with `--props='{"safeZones":true}'`; no text in the red areas (top 7%, right 15% from 45–80%,
  bottom 20%).
- Fonts: one bold sans word + one cursive (`script`/`brush`) per beat, handwritten `hand` notes, `elegant` italics.
- SFX on every visual event (keys, pencil, shutter, flaps, switch, clink, tom on the big moments). Riser ends on the
  climax; music drops out 0.5 s before it.
- Calendar or counter beats get flap sounds per flip/tick, accelerating.
- Clips inside cards: wrap in `<Sequence from={cardStart}>` so they start when they appear.
- People: confirm who is who from one reference photo per person before building beats around them.

## Music

- An original bed via `tools/music_bed.py` (no copyright), synced to the climax, or a song Juan picks.
- Third-party songs: deliver the no-music mp4 and add the sound in the app. Only bake in a song if Juan has a license
  (Artlist / Epidemic / his own). Avoid vocals under the voice.

## Retention rules (from kit/docs/recherche-2026-10.md)

- First 1.5-3 s decide: strongest image + line first, no slow intro. Face big and early when there is one.
- One clear emotional peak tied to the content (`climax`).
- Text on screen word by word with the voice. No vocals under the voice. Cuts every 2-3 s are enough.
- Instagram: max 5 hashtags. TikTok: 3-4 relevant hashtags. No #fyp / #viral. End the caption with a question.
- Variants: change ONE thing (first 1.5 s first), wait 72 h, compare 3-s hold rate, avg watch time, shares.

## Rules

- Juan approves every script before full render and every final video + caption before anything goes public.
- Never invent numbers or claims. MantAI facts only from Juan or his notes. Never name customers/prospects unless Juan says so.
- Reference creators' handles, watermarks and names never appear in our video.
- Report in one line per step; at the end: what was made, what was checked, what is open.
