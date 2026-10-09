# Workflow: from a reference reel to a posted video

This is the fast path. It exists because the first video made with this repo took **11.5 hours** for 34 seconds, and almost all of that time went into five avoidable mistakes ([case study](case-study-founder-mix.md)). Follow the order below and a 30–40 s video takes **under 2 hours**, most of it your own recording time.

```
 reference ─▶ script ─▶ VOICE ─▶ spec ─▶ preview stills ─▶ render ─▶ approval ─▶ post
   (1)          (2)       (3)      (4)        (5)             (6)        (7)        (8)
                 ▲ you approve      ▲ timing comes from the voice   ▲ you approve   ▲ you approve the exact file + caption
```

## The five rules

| Rule | What breaks without it |
|---|---|
| **1. Voice first.** Record before any timing work. | Every beat gets timed twice: once to a guide voice, then again to the real take. All cue times drift. |
| **2. Spec, not code.** One `spec.json` per video, rendered by the `Short` composition. | A hand-coded composition per video means every change is a code edit plus a full re-render. The founder reel's two compositions are 24 KB and 28 KB of one-off code. |
| **3. One reference per video**, chosen before anything is built. | Mixing two styles mid-way threw away the first hour. |
| **4. Stills before the full render.** | Dead frames, text under the TikTok buttons and a weak hook were all found after "final" renders. |
| **5. Render where the files live.** | Rendering in the cloud and shipping tarballs back and forth cost an evening. |

## 1. Pick one reference

Find a reel whose **structure** works for your story: a hook that stops the scroll, a rhythm of cuts, a clear peak. You copy the structure, never the footage.

```bash
tools/grab.sh "<reel or short URL>"      # → refs/<site>-<id>.mp4, .info.json, -sheet.jpg, .wav
python3 tools/words.py refs/<site>-<id>.wav
```

Look at the contact sheet (one frame every 0.5 s) and write down:
- **Hook:** what happens in the first 1.5 s (image + words)
- **Beats:** how many, how long each, where the cuts fall
- **Text:** where it sits, how big, how many words at once
- **Peak:** where the emotional high point is and how it's built (riser, drop, drum)
- **Close:** how it ends (call to follow, question, loop)

## 2. Script and caption

Rebuild the reference's structure with your own story.

- **One line per beat, one beat per cut.** About 3 words per second, so ~40 words per 15 s.
- **Every line carries a number or a mechanism.** "Up to four weeks in advance" beats "really early". No fluffy metaphors.
- **Strongest image and line first.** The first 1.5–3 s decide whether anyone stays.
- **Name the move and the proof.** A place change ("Zürich → Berlin → San Francisco"), a concrete result ("And it works.") over real footage.
- **Check every fact.** "I talked to exactly one person" stays only if it's literally true. Illustrations (a sample alert) must not pass as customer data. No customer names unless cleared.
- **Caption:** one hook line, end on a question, 3–5 specific hashtags (Instagram allows 5; #fyp and #viral do nothing).

Get the script approved before anyone records it.

## 3. Record the voice (before anything else is timed)

Record in [voice-coach](https://github.com/juanito-lab/voice-coach): it shows one line at a time, coaches pace and level, keeps every take with its loudness, noise floor and a ★ best take, and exports a `.lines.json` that maps each script line to its place in the take. **Three takes at most.** Pick by numbers, then by ear (loudness around −16 LUFS, noise floor below −50 dBFS, no clipping).

```bash
python3 tools/voice_assemble.py take.wav videos/<id>/vo.wav videos/<id>/plan.json take.lines.json 1.08 0.22 0.22
python3 tools/words.py videos/<id>/vo.wav > videos/<id>/words.json
```

`voice_assemble.py` cleans the take (high-pass, noise reduction, de-esser, compressor), levels it to −16 LUFS, speeds it up 8% without changing the pitch, caps pauses at 0.22 s and writes `plan.json` (where each line now starts). Details: [voiceover.md](voiceover.md).

## 4. Build the spec

```bash
tools/new_video.sh 2026-10-12-first-pilot
```

Put the voice and any clips in that folder, or reference files from `library/` by name. Then fill `spec.json`:

1. **Scene durations from the voice.** Scene `dur` = the gap between consecutive line starts in `plan.json` (`lines[i+1].start − lines[i].start`); the last scene runs to the end of the voiceover plus ~0.3 s. The durations must add up to the voiceover length (the checker warns if they're off by more than 0.5 s).
2. **Word times from the voice.** Each word's `t` = its start in `words.json` minus the scene's start. The word appears 0.1 s before that, so it's on screen when it's spoken.
3. **Media per scene.** `full` for footage, `tall` (4:5) for people, `inset` (16:9) for landscape clips and screenshots. A clip plays from the start of its scene, from `startSec` into the file.
4. **One climax.** Mark the emotional peak with `"climax": true`: the music drops out for 0.5 s before it, a riser ends on the cut, a drum hits on it.
5. **Covers and caption.** `covers` = frames (30 fps) to export as cover candidates; the first one is also the cover frame when posting. `post.caption` + `post.hashtags`.

Every field: [spec-reference.md](spec-reference.md).

## 5. Preview stills (the real check)

```bash
tools/make.sh videos/<id> --preview
```

About 15 seconds. First `check_spec.py` runs (missing files, text probably under the app UI, length, hashtags). Then you get one still per scene, taken just after its last word appears, with the areas TikTok and Reels cover drawn in red, plus `preview-sheet.jpg` with all of them side by side.

Look at every still:
- No text in the red areas (photos may run under them).
- Nothing overlapping, everything readable over the footage.
- No black or empty frame anywhere; every beat is footage or a card on a moving background.
- The hook still (scene 1) is the strongest image you have.

Fix, re-run, and send the sheet and the hook to whoever approves before the full render.

## 6. Render

```bash
tools/make.sh videos/<id>
```

Outputs in `videos/<id>/out/`: the mp4 (H.264, 1080×1920, 30 fps, mastered to −14 LUFS), a `_no-music` version when the spec has music, the covers, `caption.txt` and `render.json`. Expect about 1 minute of rendering per 10 s of video on a laptop, which is why the stills come first.

Watch it once, full screen, **with sound**. Agents can't listen: every sound change needs a human ear before posting.

## 7. Approval

The person who owns the account approves **the exact file and the exact caption**:

```bash
python3 tools/post.py approve videos/<id>
```

This stores SHA-256 hashes of both. Change a frame or a comma and the approval no longer matches.

## 8. Post

```bash
python3 tools/post.py publish videos/<id> --to instagram,tiktok --now --dry-run   # see exactly what would be sent
python3 tools/post.py publish videos/<id> --to instagram,tiktok --now             # or --at 2026-10-12T18:30, or --draft
```

Setup and options: [posting.md](posting.md). If you want a trending sound from the app's library, post the `_no-music` file manually instead: platform music can't be added through the API.

## After posting

- Compare after **72 hours**: share of viewers still watching at 3 s, average watch time, shares per reach, new followers. Likes alone say little.
- Testing a variant: change **one** thing (the first 1.5 s first), export it as a new file with a new cover and caption. On small accounts a real difference needs ~14 percentage points; see [research.md](research.md).
- Add new clips to `library/LIBRARY.md`, and any new lesson to [case-study-founder-mix.md](case-study-founder-mix.md) or a case study of your own.

## Time budget (target)

| Step | Time |
|---|---|
| Reference + structure notes | 10 min |
| Script + caption + approval | 15 min |
| Recording (3 takes) + assembling | 20 min |
| Spec | 30 min |
| Preview loop | 15 min |
| Render + watch | 10 min |
| Approval + post | 5 min |
| **Total** | **under 2 h** |
