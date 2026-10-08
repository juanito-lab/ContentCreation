# What we learned making the MantAI founder reel

Built 2026-10-08 for @juansimon.builds. Each point here cost at least one redo, so read them before the next video.

## 1. Story and script

- **Copy a structure that already works, not the footage.** Two references, mixed:
  - Jasper Kallfelz's ATHLAITE reel (17 s, all graphics): text stack hook, map, school, grid of faces where the co-founder lights up, a photo wall that ends on the brand name, a rising number, a product animation, "I'm X, this is only the beginning".
  - Santi's founder reel (60 s, real footage): talking to camera, full-screen b-roll with a centred white subtitle, mixed-font text cards, and a "follow this journey along" close.
  - The mix works because the graphics carry the claims and the real footage carries the credibility.
- **Script:** one line per beat, one beat per cut, about 3 words per second. 11 lines came out to 37 s after editing.
- **Name the move:** Zürich → Berlin → San Francisco (with SF dashed as "next").
- **Name the proof:** "up to four weeks in advance", then "And it works." over the real device on a real dashboard.
- **Check people before using them.** The first version showed the wrong person as Santi. "The one with long hair" was ambiguous, and one clear photo fixed it. Ask for one reference photo per person up front.
- **Check facts before posting:**
  - "Talked to exactly one person": only keep it if it's literally true.
  - The alert card ("brake pad wear, ~4 weeks to failure") is an illustration, not customer data.
  - Never name customers.

## 2. Material (507 phone files)

- **Pick from contact sheets, not file names.** `tools/contact_sheet.py` puts 60 numbered thumbs on one image, so 507 files fit on 9 sheets.
- **Check that a person stays in frame.** For a candidate clip, make a strip of 5 frames across its length.
- **iPhone photos are often stored sideways.** Apply the EXIF rotation (`ImageOps.exif_transpose`). Plain ffmpeg ignores it.
- **iPhone video can be HDR (HLG/PQ).** Tone-map it to SDR or it looks washed out. But only tone-map when `color_transfer` says HLG/PQ: tone-mapping SDR footage makes it darker. `tools/media_prep.py` handles both.
- **Card layout and timing:**
  - Use 4:5 cards for people (crop with an x-offset so the face stays in), and 16:9 or 16:10 cards for landscape clips.
  - A clip inside a card plays from the **start of its beat**, not from when the card appears. Wrap the card in a `<Sequence from={cardStart}>`, or the viewer only sees the end of the clip.
  - A 1 s good moment can carry 1.8 s if you slow it down (`setpts=1.8*PTS`, plus `minterpolate=mi_mode=blend` for smoothness).

## 3. Platform safe zones (TikTok + Reels)

- **Keep text out of these areas:**
  - the top 7% (status bar / "For you")
  - the right 15% from 45% to 80% of the height (profile, like, comment, share)
  - the bottom 20% (caption, sound name)
- **Photos may run under the buttons, text may not.**
- **`safeZones: true` prop** draws red boxes over the frame. Render stills with it on before every final render.
- **Typical fixes:** smaller "MANTAI", "works.", "4 weeks", "beginning"; captions moved from 50% up to 38%; outro card 76% wide instead of 86%; follow-along at 75% height.

## 4. Voice (recorded with juanito-lab/voice-coach, .webm)

- **Map the take first.** `tools/voice_chunks.py take.webm --words` splits the take into chunks at the pauses, transcribes each chunk offline (PocketSphinx, which needs no model download, so it works where Hugging Face is blocked), and gives word start times. The text is rough ("call found it" = "co-founder") but fine for telling which line a chunk is.
  - This also catches retakes. In take 5 Juan said "I'm Juan" twice, and we kept the second.
- **Pick the take by numbers, then by ear:**
  - Loudness: take 5 was −16.7 LUFS; the quietest takes were −23 to −27, which is too quiet.
  - Noise floor: −57 dB was the best of the five.
  - Clipping: 0.2 dBFS peaks get fixed by the chain below.
- **Build the voice track with `tools/voice_assemble.py raw lines.json out.wav plan.json 1.08 0.22 0.22`:**
  - Clean-up chain: highpass 80 Hz, noise reduction (afftdn), de-esser, compressor 2.5:1, loudnorm to −16 LUFS / −1.5 dBTP.
  - Speed: `atempo 1.08`, 8% faster with the same pitch. It still sounds natural and fixed "a bit slow".
  - Pauses inside a line capped at 0.22 s; 0.22 s tail per line.
  - Stutter: `{"stutter":[a,b],"n":2}` repeats a short slice ("t-t-two weeks").
  - Result: 52 s raw → 37.5 s.
- **Retime the edit from the plan.** The plan json maps source time to new time. Beat lengths = gaps between line starts. In-beat cue times (text pops, card swaps, the climax) come from word times mapped through the plan. Every cut then lands on a word.
- **Final mix:** voice −16 LUFS, music bed about 10 LU under the voice, master −14 LUFS / −1 dBTP for TikTok/Reels.
- **The voice should sit lower than you think.** Juan said "too loud" three times. We ended at `voVolume` 0.45 (from 1.0), and SFX at 1.5. The mastering gain brings the overall level back up, so lowering the voice only changes the balance against the SFX and music.

## 5. Sound design

- **Use only real recorded SFX.** Every visual event gets one. About 100 cues in 37 s.
- **When the kit lacks a sound, scrape a CC0 one** (see `studio/public/sfx/CREDITS.md`):
  - BigSoundBank (Joseph Sardin, CC0) has planes, page turns, map unfolds, pen clicks, crowds and shutters.
  - The cloud shell can't reach it, so open it in a browser, fetch the file in page JS, return it as base64, and decode it from the session log. Never retype base64 by hand.
  - Trim each file to its best part, then note `len`, `lead` (ms to the hit) and `loud` (loudest 50 ms, dB) in `lib/sfx.tsx`. A cue's level is `loud + 20·log10(vol)`.
  - Don't synthesize sounds that should be real. Our numpy plane clicked, and the recorded one fixed it.
- **The plane on the map:** start the flyby sound early so its peak lands on the arrival (`lead`).
- **Fast cuts need sound:** a rope whoosh plus a white flash plus a zoom punch on every hard cut, and a pen click on each caption pop.
- **Pick the sound to match the visual:**
  - typing → keys
  - handwriting → pencil/pen
  - photo appears → shutter
  - pin drops → card place
  - grid of faces → flap burst
  - toggles → switch
  - the "it works" ✓ → clink
  - big moments → tom drum
- **Calendar flip:** 2 stutter lifts in sync with "t-t-two" (the page lifts and snaps back), then 13 accelerating flips from day 1 to day 14 with alternating flap pitches, a land thud, and "first device ✓" on day 14.
- **Riser timing:** the riser ends exactly on the climax ("MantAI"). The music drops out for 0.5 s right before it, then a drum plus crash.

## 6. Music

- **We had no downloadable music.** Stock sites are blocked, and third-party songs risk mutes and strikes.
- **`tools/music_bed.py` synthesizes an original bed** (no samples, so no copyright): 120 BPM, A minor (Am–F–C–G). The bar grid is aligned so a downbeat lands on the climax.
  - Sections: pad intro → half-time verse → 4-on-the-floor build with riser → 0.5 s dead silence → drop → soft outro.
  - Check the energy curve with RMS per window. The first try had the verse louder than the build: the bass was too hot.
- **Always render a no-music version too**, so you can add a trending sound in the app.

## 7. Type

- **Fonts are bundled locally** (Fontsource woff2 in `studio/public/fonts`), so renders work offline. Remote Google Fonts broke the server render.
- **Seven looks:** `sans` (Inter 800), `sansLight`, `serifItalic` (Playfair), `script` (Pinyon), `hand` (Caveat, notes and annotations), `brush` (Dancing Script), `elegant` (Instrument Serif italic).
- **Pattern:**
  - one bold sans word plus one cursive word per beat ("one" + *person*, "Stanford" + *changed everything*)
  - handwritten side notes ("summer 2026", "our first device", "follow along →")
  - subtitles alternate sans / elegant / brush

## 7b. Pace and look (feedback on v3/v4)

- **No slow motion and no black moments.** Every beat is full-bleed footage or a card on a moving background. The dorm line is three clips cut on the three caption words, each in its own `<Sequence>` so it starts at frame 0.
- **Bigger type:** the hero words fill about 70–90% of the width (Zürich 270 px, dream 350, Juan 290). Check the size against the safe zones after every change.
- **Colour:** white plus red (#e11d2e) on footage, black plus red on light cards. Use red script for the emotional word ("late nights.", "together", "beginning") and the red "AI" in MANTAI. Give red text over dark footage a white glow, or it gets lost.
- **Motion:**
  - every word tips a few degrees and overshoots when it pops (`lib/words.tsx`)
  - a hand-drawn swoosh underline draws in under the payoff words
  - a decaying camera shake on the climax
- **Ambient glow around every card** (Jasper's `AmbientInset`): a blurred, saturated copy of the card behind it (`scale 1.07, blur 58, brightness 1.3, saturate 1.8, opacity 0.85`). It makes a card feel lit by the footage.
- **Travel map:**
  - a Mercator world map in SVG (`lib/worldmap.ts`)
  - a plane flies along a dashed arc Zürich → Berlin → SF
  - the city labels pop in when the plane lands
  - the camera pans with the plane

## 8. Studio in the browser

- **Remotion Studio can't be reached from the desktop browser pane** when it runs on a cloud box. Instead:
  - `npx remotion bundle --public-path=./`, then publish the folder as a claude.ai artifact.
  - Add `history.replaceState(... '?/FounderMix')` to index.html so it opens on the right composition (the read-only studio uses query-string routing).
- **Artifact limits:** 64 MB per publish and 16 MB per file. Drop unused media and `.map` files from the build. If it's still too big, publish twice: media first, then code. Files you leave out of a republish stay in place.
- **Studio crash:** the props editor crashes on optional `z.string()` fields (`value.startsWith`). Give every string a `.default("")` and pass fully-parsed defaults.

## 9. Delivery

- **Moving files:** the device bridge can't overwrite or delete in the Mac folder (`cat > file` works for overwriting), and commits are capped at 20 MB per file. Re-encode at CRF 19–21 for the folder copy.
- **Speed:** one 37 s render takes about 4–5 min on the cloud box, so check single frames before every full render.

## 10. Working with agents

- **Route by task:** Sonnet subagents do editing, animation, sound and voice. Opus does scraping and research. The main session plans, checks and delivers.
- **Brief the editing agent with numbers:**
  - exact file names, sizes, SFX volumes
  - what must not change (`MIX_DURS`, `T`, voice volume)
  - "check stills with `safeZones` on before the full render"
- **Agents can't listen.** Check every SFX change by ear before posting.
