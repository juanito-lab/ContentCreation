# Founder mix (MantAI, @juansimon.builds), recipe

Composition `FounderMix` (studio/src/FounderMix.tsx), about 37.7 s.

## Script (one line per beat)

1. I left Zürich to chase my dream. *(Zürich sunset hill, full-bleed)*
2. Zürich. Berlin. Next: *(map, Zürich → Berlin solid, → SF dashed "next")*
3. …San Francisco. *(SF skyline)*
4. At CODE's open day, I talked to exactly one person. *(Santi card, real speed)*
5. Out of everyone there, he's now my co-founder. *(avatar grid → Santi)*
6. Same dorm. Late nights. Pivot after pivot. *(3 hard cuts dorm1 → dorm3 → dorm2, one per caption)*
7. Then Stanford changed everything. *(Santi at the Stanford podium + "summer 2026" note)*
8. T-t-two weeks later: our first device. Our first pilot. *(calendar flips 1 → 14 with a stutter, device → on real cars → pilot McLaren)*
9. Together, we're building MantAI. *(photo wall → MANTAI, the climax: riser, drop-out, drum)*
10. Next-gen tech that predicts vehicle issues up to four weeks in advance. *(waveform + alert, illustrative)*
11. And it works. *(works.mp4, the real device on a dashboard, plus a swoosh)*
12. I'm Juan. This is only the beginning. *(Juan with mic, squiggle, follow along →)*

## Rebuild from scratch

```bash
# 1. media (from the Mac's Downloads folder)
python3 tools/media_prep.py ~/Desktop/MantAI/General\ Videos/Downloads studio/public/mix videos/founder-mix/media_jobs.json
#    plus: stanford.jpg (sent in chat), santi_face2.jpg (crop of it),
#    santi_clip_rt.mp4 = IMG_1862.mov, crop 4:5 at x 0.66, real speed (no slow-mo)
# 2. voice: take 5 (voice-coach 2026-10-08 18-41-31)
python3 tools/voice_chunks.py take5.webm --words          # check lines / retakes
python3 tools/voice_assemble.py take5.wav studio/public/vo/juan-t5-fast.wav plan.json videos/founder-mix/lines.json 1.08 0.22 0.22
# 3. music
python3 tools/music_bed.py studio/public/music/mantai-bed.wav 37.75 27.83 21.35 32.98 34.6
# 4. render, then master to −14 LUFS / −1 dBTP (see docs/LEARNINGS.md §4)
```

Beat lengths (`MIX_DURS`) and in-beat cue times (`T`) in FounderMix.tsx come from `plan.json` (word times mapped
through the voice edit). With a new take, redo steps 2 and 4 and recompute both.
