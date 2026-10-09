# Look, type and safe zones

## Safe zones (TikTok + Instagram Reels)

Both apps draw their own UI over your video. Text under it can't be read. These are the union of both apps on a 1080 × 1920 frame:

```
 ┌──────────────────────────┐  0
 │ ████ status bar, tabs ███ │
 ├──────────────────────────┤  220 px (11.5%)
 │                          │
 │      text-safe area      │
 │                          │
 │                     ┌────┤  864 px (45%)
 │                     │ ♥  │  right column: profile, like,
 │                     │ 💬 │  comment, share, sound
 │                     │ ↗  │  (135 px wide)
 ├─────────────────────┴────┤  1470 px (76.5%)
 │ ███ caption, username, ██ │
 │ ███ sound, progress bar ██ │
 └──────────────────────────┘  1920
```

- **Text:** y 220–1470 px; between 45% and 80% of the height also x ≤ 945 px.
- **Photos and footage may run under the UI**; only text may not.
- The overlay lives in `studio/src/lib/safezones.tsx`. `tools/make.sh --preview` renders every scene with it; `--props='{"safeZones":true}'` turns it on in any `remotion still` call.
- `tools/check_spec.py` estimates each word's box from its size and length and warns when it probably reaches into a red area. The stills are the real check.

Typical fixes from the first video: hero words made smaller (they still fill 70–90% of the width), captions moved up from 50% to 38%, the outro card from 86% to 76% wide, the handle and "follow along" line moved up to ~68–75% height.

## Type

Three faces, bundled as woff2 in `studio/public/fonts` so renders work offline (remote Google Fonts broke a server render):

| Key | Face | Use |
|---|---|---|
| `sans` | Inter Tight 700 | names, numbers, hero words ("Zürich", "MANTAI", "4 weeks") |
| `serif` | Libre Caslon Display | connectors and elegant lines ("to chase my", "then", "in advance") |
| `script` | Great Vibes | the one emotional word per beat, in red ("dream", "together", "beginning") |

They are free lookalikes of Apple's SF Pro Display Bold, Big Caslon and Snell Roundhand, which can't be shipped with a renderer. All three are SIL Open Font License.

**The pattern per beat:** one bold sans word + one red script word, small serif connectors around them. Subtitles over footage alternate sans and serif.

**Size:** hero words fill 70–90% of the width (e.g. "Zürich" at 270 px, "dream" at 350). Lines 80–90 px, punch words 140–180, script words 280–400. Check the size against the safe zones after every change.

**Motion:** words cut in and stand still. Static text read better over fast footage than pops, tilts and bounces did.

To add a face: download the woff2 from [Fontsource](https://fontsource.org), put it in `studio/public/fonts`, load it in `studio/src/lib/fonts.ts`, add a key to `FONTS` and to `fontEnum` in `Short.tsx`.

## Colour

- **White + red** (`#E10600`) on footage, **black + red** on light cards. Red is for the emotional word and brand accents only.
- Red text over dark footage needs a white glow, or it disappears.
- Green (`#12b76a`) for counters and status dots (shapes, not body text).
- Set your own in `theme` per spec, or change the defaults in `videos/_template/spec.json`.

## Pace

- **No slow motion and no black frames.** Every beat is full-bleed footage or a card over a moving background.
- **Cuts every 2–3 seconds** are enough; in a fast edit no shot holds longer than ~1.2 s.
- One beat per script line; a line with three phrases can carry three cuts, each on its word.
- A 1-second good moment can carry 1.8 s if you slow it (`setpts=1.8*PTS` plus `minterpolate=mi_mode=blend`), but only for footage, never as a "slow-mo" effect.

## Cards

- **4:5 cards for people** (crop with an x-offset so the face stays in), **16:9 for landscape** clips and screenshots.
- A clip inside a card starts on the scene's first frame (in `Short` every scene is its own sequence). In hand-built compositions, wrap a card's clip in `<Sequence from={cardStart}>`, or viewers only see the end of the clip.
- An ambient glow behind a card (a blurred, saturated copy of it: scale 1.07, blur 58, brightness 1.3, saturate 1.8, opacity 0.85) makes it look lit by the footage. It's in the founder-reel beats (`AMBIENT` in `studio/src/examples/founder-mix/FounderIntro.tsx`), not in `Short` yet.

## Covers

- TikTok recommends 1080 × 1920 with text that sums up the video. Through the API only a frame of the video can be the cover (`covers[0]`).
- Instagram's profile grid shows the **centre** of the cover, so put the title there.
- `make.sh` exports every frame in `covers` as `cover-<frame>.png`: pick one, or design a cover from it.
