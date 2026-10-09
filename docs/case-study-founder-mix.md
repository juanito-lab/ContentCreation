# Case study: the founder reel (MantAI, @juansimon.builds)

The first real video made with this repo: a 34–37 s founder story for Instagram. It took **about 11.5 hours**. This page is the honest log of where the time went and the rule each mistake produced. The rules are now built into the [workflow](workflow.md), the tools and the agent skills.

The compositions live in `studio/src/examples/founder-mix/` (`FounderMix.tsx` is the final cut, `FounderIntro.tsx` the first draft whose beats it reuses). They need the creator's own media, which isn't in the repo. The script and rebuild steps: [`videos/founder-mix/README.md`](../videos/founder-mix/README.md).

## The story, one line per beat

| # | Line | Picture |
|---|---|---|
| 1 | I left Zürich to chase my dream. | Zürich sunset, then a motorbike, two hard cuts |
| 2 | Zürich. Berlin. Next: | light world map, a plane flies Zürich → Berlin, then a dashed arc to SF |
| 3 | …San Francisco. | SF skyline → bay-view office |
| 4 | At CODE's open day, I talked to exactly one person. | the school, the crowd, the co-founder's clip, the two of us |
| 5 | Out of everyone there, he's now my co-founder. | a grid of faces, one lights up |
| 6 | Same dorm. Late nights. Pivot after pivot. | three hard cuts of late-night work, one per phrase |
| 7 | Then Stanford changed everything. | plane window → the co-founder at the Stanford podium, "summer 2026" note |
| 8 | T-t-two weeks later: our first device. Our first pilot. | a calendar flips day 1 → 14 with a stutter, then the device, the mount, the pilot car |
| 9 | Together, we're building MantAI. | a photo wall that ends on the brand name: **the climax** |
| 10 | Next-gen tech that predicts vehicle issues up to four weeks in advance. | waveform + an alert card (illustrative, not customer data) |
| 11 | And it works. | the real device on a real dashboard, a check mark |
| 12 | I'm Juan. This is only the beginning. | the creator with a mic, a squiggle arrow, "follow along →" |

Two references were mixed: Jasper Kallfelz's all-graphics ATHLAITE reel (text stack hook, map, grid of faces, photo wall, rising number, product animation) and Santi's 60 s real-footage founder reel (talking to camera, full-bleed b-roll with a centred subtitle, mixed-font cards, "follow this journey along" close). The mix worked because **the graphics carried the claims and the real footage carried the credibility**. It also cost an hour (see blocker 4).

## Where the 11.5 hours went

| Time (Oct 8) | What happened |
|---|---|
| 12:44–13:51 | Built `FounderIntro` as a one-off composition from the ATHLAITE reference and rendered it with a guide voice. Later replaced. |
| 13:51–15:58 | Media search: 9 contact sheets of a Downloads folder to find usable clips and photos, 35 files copied in. |
| 16:01–16:19 | Switched to a second composition, `FounderMix`. v1 rendered with the guide voice. |
| 16:38–16:59 | Searched for a usable face crop of the co-founder (7 candidates). v2 rendered. |
| 17:45–18:26 | Built the [voice-coach](https://github.com/juanito-lab/voice-coach) recording app (about 40 minutes). |
| 18:45–18:53 | Take 5 cleaned. All 12 beat lengths re-fitted to it. Rendered "FINAL_take5". |
| 19:46 | A third batch of media. Only one clip made it in. |
| 23:43–00:09 | An 82 MB tarball shipped from the cloud to the laptop. v3 fixes (dead frames on the map, a clip not full-bleed from frame 0), a cold-open variant, 2 covers, the caption. |

Afterwards a long safe-zone and legibility pass (v8 → v17) moved and resized most of the text.

## The seven blockers and the rule each one produced

1. **No media library.** Every clip had to be found and identified from scratch, three times.
   → `library/` with one line per file in `LIBRARY.md`; new material goes to `library/inbox/` first. ([media.md](media.md))
2. **Hand-coded compositions instead of a spec.** 28 KB and 24 KB of one-off code; every change was a code edit and a full re-render. The spec pipeline was never used because `Short` lacked the map, avatar grid, photo wall, alert card and squiggle beats.
   → Spec, not code. A missing beat type gets added to `Short` once as a reusable scene option. ([spec-reference.md](spec-reference.md#missing-a-beat-type))
3. **The voice came last.** Timing was built on a guide voice and take 1, then all 12 beats were re-fitted to take 5.
   → Voice first, max 3 takes, timing from the assembled take only. voice-coach now exports a `lines.json` per take. ([voiceover.md](voiceover.md))
4. **Two references and a restart.** The first hour was thrown away when the style changed.
   → One reference per video, chosen before anything is built.
5. **Problems found after the "final" render.** Dead frames on the map, a clip not full-bleed, the hook swap.
   → Preview stills of every scene with safe zones before any full render; the hook is approved on a still. (`make.sh --preview`)
6. **Rendering in the cloud, then shipping tarballs.** Four round trips, the last one 82 MB overnight.
   → Render where the files live (the laptop or the agent server), straight into `videos/<id>/out/`.
7. **Posting wasn't connected.** The finished video sat on disk.
   → `tools/post.py` with Zernio and an approval lock. ([posting.md](posting.md))

## What worked (keep doing it)

- **Contact sheets** of the whole camera roll: 507 files on 9 images.
- **iPhone fixes:** EXIF rotation for photos; HDR → SDR tone-mapping only when the clip is actually HDR.
- **Voice numbers:** take 5 was −16.7 LUFS with a −57 dB noise floor; the quiet takes (−23 to −27 LUFS) were unusable. +8% tempo and 0.22 s pause caps took 52 s of raw voice to 37.5 s.
- **Every cut on a word,** from the voice plan's time map.
- **About 100 real sound cues** in 37 s; a riser that ends exactly on the climax with 0.5 s of silence before it.
- **Voice lower than expected:** the mix ended at `voVolume` 0.35–0.45 after "too loud" came up three times.
- **Static, big type:** hero words at 70–90% of the width, one red script word per beat, hard cuts instead of pops.
- **Bundled fonts:** remote Google Fonts broke a server render.
- **No embedded music:** the cuts were snapped to the tempo of the song the creator planned to add in the app (172 BPM), so the track lines up later.

## Studio in a browser without a local server

When Remotion Studio runs on a remote box you can't open `localhost`. What worked: `npx remotion bundle --public-path=./`, publish the folder as a static page, and add `history.replaceState(... '?/FounderMix')` to `index.html` so it opens on the right composition. Drop unused media and `.map` files to stay under upload limits.

The props editor crashed on optional `z.string()` fields (`value.startsWith`); every string in a schema now has `.default("")` and the defaults are fully parsed.
