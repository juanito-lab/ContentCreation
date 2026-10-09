# Founder mix (case study)

The MantAI founder reel for @juansimon.builds: compositions `FounderMix` (final cut, ~37 s, 12 beats) and `FounderIntro` (first draft, shares its beats) in `studio/src/examples/founder-mix/`. What went right and wrong: [docs/case-study-founder-mix.md](../../docs/case-study-founder-mix.md).

This is a **hand-coded** video, kept as a reference for beats `Short` doesn't have yet (travel map, avatar grid, photo wall, alert card, squiggle outro, calendar flip). New videos use a spec instead.

## Script (one line per beat)

1. I left Zürich to chase my dream. *(Zürich sunset hill, full-bleed)*
2. Zürich. Berlin. Next: *(map, Zürich → Berlin solid, → SF dashed "next")*
3. …San Francisco. *(SF skyline)*
4. At CODE's open day, I talked to exactly one person. *(co-founder card, real speed)*
5. Out of everyone there, he's now my co-founder. *(avatar grid → co-founder)*
6. Same dorm. Late nights. Pivot after pivot. *(3 hard cuts dorm1 → dorm3 → dorm2, one per caption)*
7. Then Stanford changed everything. *(the Stanford podium + "summer 2026" note)*
8. T-t-two weeks later: our first device. Our first pilot. *(calendar flips 1 → 14 with a stutter, device → on real cars → pilot car)*
9. Together, we're building MantAI. *(photo wall → MANTAI, the climax: riser, drop-out, drum)*
10. Next-gen tech that predicts vehicle issues up to four weeks in advance. *(waveform + alert, illustrative)*
11. And it works. *(the real device on a dashboard, plus a swoosh)*
12. I'm Juan. This is only the beginning. *(Juan with mic, squiggle, follow along →)*

## Files in this folder

| File | What it is |
|---|---|
| `media_jobs.json` | the `tools/media_prep.py` job list that turned the phone originals into edit media (output name, source file, start, duration) |
| `lines.json` | the `tools/voice_assemble.py` chunk list for take 5 (one entry per script line, with the "t-t-two" stutter) |

The media itself (`studio/public/mix/`, `studio/public/vo/`, `media/`) is personal and git-ignored.

## Media used (in `studio/public/mix/`)

| File | What it is | Used in |
|---|---|---|
| hook.mp4 | Zürich sunset, full-bleed | Hook |
| sf.mp4 | San Francisco skyline | SF |
| duo.jpg | Juan and his co-founder | Photo wall |
| santi_clip.mp4, santi_slow.mp4 | the co-founder (slow = the full-bleed version) | Open day |
| santi_face2.jpg | face crop (best of 7 tries) | Avatar grid highlight |
| dorm1.mp4, dorm2.mp4 | late-night laptop work in the Berlin dorm | Dorm |
| stanford.jpg | Stanford | Stanford |
| device.jpg, mount.jpg, pilot.jpg | first device, device mounted, pilot car | Build + photo wall |
| w1–w9, w13–w17 .jpg | build-in-public stills | Photo wall (w4 = "and it works") |
| outro.mp4 | Juan with a mic | Outro |
| plane.mp4 | plane window | spare |
| dash.mp4 | device on the dash | FounderIntro only |

## Rebuild from scratch

```bash
# 1. media: phone originals → edit media
python3 tools/media_prep.py <folder with the phone originals> studio/public/mix videos/founder-mix/media_jobs.json
#    plus stanford.jpg, santi_face2.jpg (a crop of it) and santi_clip_rt.mp4 (IMG_1862.mov, 4:5 crop at x 0.66, real speed)
# 2. voice: take 5 from voice-coach
python3 tools/voice_chunks.py take5.webm --words          # check lines and retakes
python3 tools/voice_assemble.py take5.wav studio/public/vo/juan-t5-fast.wav plan.json videos/founder-mix/lines.json 1.08 0.22 0.22
# 3. music (optional; the final cut ships without music and gets a song in the app)
python3 tools/music_bed.py studio/public/music/mantai-bed.wav 37.75 27.83 21.35 32.98 34.6
# 4. render
cd studio && npx remotion render FounderMix out/founder.mp4
npx remotion still FounderMix check.png --frame=300 --props='{"safeZones":true}'   # red = covered by TikTok/Reels UI
```

Beat lengths (`MIX_DURS`) and in-beat cue times (`T`) live in `studio/src/examples/founder-mix/mixtimes.ts` and come from the voice plan (word times mapped through the edit). With a new take, redo step 2 and recompute both. The final file was mastered to −14 LUFS / −1 dBTP afterwards ([docs/voiceover.md](../../docs/voiceover.md#5-mix-levels)).
