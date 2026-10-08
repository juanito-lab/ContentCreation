# ContentCreation: shortform video studio

Short vertical videos (TikTok / Instagram Reels) for **@juansimon.builds**, made with [Remotion](https://www.remotion.dev)
and AI agents (Claude, Hermes). Built on Jasper Kallfelz's
[shortform-edit-kit](https://github.com/JasperKallfelz/shortform-edit-kit), which is included as the `kit/` submodule
(sound kit, research, edit tools). Thanks, Jasper.

**Read [`docs/LEARNINGS.md`](docs/LEARNINGS.md) first.** It covers everything we learned shipping the first reel:
script, material, safe zones, voice, sound, music, type and delivery.

```
studio/            Remotion project
  src/Short.tsx        spec-driven template: one JSON = one video (tools/make.sh)
  src/FounderMix.tsx   the MantAI founder reel (Jasper's graphics × Santi's real-footage style), 12 beats, ~37 s
  src/FounderIntro.tsx graphics-only version + shared beats (map, avatar grid, photo wall, alert card, squiggle outro)
  src/lib/             word-pop text, 7 fonts (bundled), SFX catalogue + track, world map
  public/sfx           60 real recorded SFX (CC0: the kit + BigSoundBank, see CREDITS.md)
  public/fonts         Inter, Playfair, Pinyon Script, Caveat, Dancing Script, Instrument Serif (OFL)
  public/music         original synthesized bed (tools/music_bed.py)
tools/
  contact_sheet.py     numbered thumbnails of a whole camera roll (pick footage fast)
  media_prep.py        phone originals → edit media (EXIF rotation, HDR→SDR only when HDR, cuts)
  grab.sh              download a reference reel + contact sheet + audio
  voice_chunks.py      map a voice take: chunks, offline transcript (PocketSphinx), word times
  voice_assemble.py    clean + level (−16 LUFS) + speed + tighten pauses + stutter → VO wav + time map
  music_bed.py         original music bed synced to the edit (climax downbeat, drop-out before it)
  make.sh / new_video.sh  render a Short spec (mp4 with/without music, −14 LUFS, covers, caption)
videos/            specs and recipes (personal media is git-ignored, it never goes into this public repo)
hermes/skills/     the shortform-video skill for Hermes / Claude agents
kit/               JasperKallfelz/shortform-edit-kit (submodule)
```

## Quick start

```bash
git clone --recurse-submodules https://github.com/juanito-lab/ContentCreation && cd ContentCreation
bash setup.sh                      # ffmpeg, node deps, Chrome headless shell, yt-dlp, pocketsphinx…
cd studio && npm run dev           # Remotion Studio on http://localhost:3000
```

Render the founder reel (media has to be in `studio/public/mix/`, see `videos/founder-mix/`):

```bash
cd studio && npx remotion render FounderMix out/founder.mp4
npx remotion still FounderMix check.png --frame=300 --props='{"safeZones":true}'   # red = covered by TikTok/IG UI
```

## Rules

- Every post needs Juan's explicit yes on the exact file and caption.
- No other creators' footage in our videos: their reels are references only.
- No personal media, voice recordings or customer names in this repo.
- Always deliver a no-music version so a sound can be added in the app.

## Licenses

- **SFX:** CC0, see `kit/SOUNDS-LIZENZEN.md` and `studio/public/sfx/CREDITS.md`.
- **Fonts:** OFL.
- **Music bed:** our own synthesis.
- **Code adapted from Jasper's kit** (`studio/src/lib/*`, parts of `Demo.tsx`): Jasper hasn't picked a license for the kit's code yet. Before reusing it beyond this project, ask him.
