# Sound and music

Sound is half of why a short video feels expensive. The rules here came from about 100 sound cues in a 37-second reel.

## Rules

- **Only real recorded sounds.** No synthesized ticks, pops or blips; they sound cheap. A synthesized plane flyby clicked; the recorded one fixed it.
- **Every visual event gets one sound**, on the same frame as the event. `Short` does this automatically (table in [spec-reference.md](spec-reference.md#automatic-sound-design-autosfx-true)).
- **Match the sound to the picture:**

| Picture | Sound |
|---|---|
| typing / a word appears | key tap |
| handwriting, a script word, a drawn line | pencil or pen |
| a photo or clip appears | camera shutter |
| a pin drops, a card lands | card place |
| a grid of faces fills | split-flap burst |
| a toggle, a check mark | switch / glass clink |
| a hard cut | rope whoosh (+ a white flash and a zoom punch, in hand-built edits) |
| a counter or calendar flips | split-flap, accelerating |
| a big moment | tom drum |

- **The riser ends exactly on the climax.** The music drops out for 0.5 s right before it, then drum + crash. `Short` does this for the scene marked `climax`.
- **A sound that carries on after its picture** (a whoosh, a pen stroke, a plane) gets cut when its animation ends (`until` in hand-built cue lists).
- **Agents can't listen.** Check every sound change by ear before posting.

## Levels

Every sound file was measured: `len` (ms), `lead` (ms from the file start to the point that should land on the picture: the hit for clicks, the loudest point for whooshes), and `loud` (loudest 50 ms in dB). A cue's peak level is `loud + 20·log10(vol)`. To swap one sound for another at the same loudness: `vol_new = vol_old × 10^((loud_old − loud_new) / 20)`.

Start with `sfxVolume` 1.3 and move all effects together. Change individual `vol` values only when one sound sticks out.

## Adding a sound

1. **Licence first.** Only CC0, public domain, or an explicit "free to redistribute and use commercially" licence. [BigSoundBank](https://bigsoundbank.com) (CC0) has planes, paper, map unfolds, pen clicks, crowds and shutters. Freesound's CC0 filter works too.
2. **Trim** to the best part, normalise to −1 dBFS, 48 kHz WAV, into `studio/public/sfx/`.
3. **Measure** `len`, `lead` and `loud`:
   ```bash
   python3 - <<'PY'
   import numpy as np, scipy.io.wavfile as wf
   sr, x = wf.read("studio/public/sfx/NEW.wav"); x = x.astype(float); x = x.mean(1) if x.ndim > 1 else x; x /= 32768
   n = int(0.05 * sr); rms = [np.sqrt(np.mean(x[i:i+n]**2)) for i in range(0, len(x) - n, n // 2)]
   i = int(np.argmax(rms)); print("len", round(len(x) / sr * 1000), "lead", round(i * (n // 2) / sr * 1000 + 25), "loud", round(20 * np.log10(max(rms)), 1))
   PY
   ```
   For a click or hit, set `lead` to 0 instead of the loudest point.
4. **Register** it in `SOUNDS` in `studio/src/lib/sfx.tsx` and add a row to `studio/public/sfx/CREDITS.md`.

If a site can't be reached from a server shell, download the file in a browser and copy it over. Never retype a file's bytes by hand.

## Music

### The safe default: no music in the file

Third-party songs get videos muted, blocked or removed, and commercial use needs a licence. Both platforms recommend their own music libraries. So:

- Leave `music` empty and add a sound from the app's library when you post manually, **or**
- set `music` and post the `_no-music.mp4` that `make.sh` renders alongside, adding the app's sound by hand, **or**
- use music you own or licensed (Artlist, Epidemic Sound, your own), **or**
- generate an original bed with `tools/music_bed.py`.

Platform music can't be attached through the posting API (except TikTok's Commercial Music Library for business accounts), so an auto-posted video carries whatever audio is in the file.

### An original bed: `music_bed.py`

```bash
python3 tools/music_bed.py library/bed.wav 37.75 27.83 21.35 32.98 34.6
#                          out               total climax build works outro   (seconds)
```

Fully synthesized (no samples, no copyright): 120 BPM, A minor (Am–F–C–G). The bar grid is shifted so a downbeat lands exactly on the climax.

| Section | From | What plays |
|---|---|---|
| Intro | 0 s | pads |
| Verse | 6.9 s | half-time kick, off-beat hats, bass |
| Build | `build` | four-on-the-floor kick, snares, 16th hats getting louder, riser |
| Gap | climax − 0.5 s | dead silence |
| Drop | `climax` | full kit, brighter pads, crash, sub drop |
| Accent | `works` | a softer crash on a second payoff line |
| Outro | `outro` | soft kick, fade |

Check the energy curve after generating (RMS per second): the build must be louder than the verse. On the first try the verse was louder because the bass was too hot.

A hand-picked song can also drive the pacing: the founder reel's cuts were snapped to a 172 BPM grid so a song added later in the app lines up with them.

### Levels

Music sits about 10 LU under the voice (`musicVolume` 0.15 to start). No vocals under a voiceover: sung lyrics compete with spoken words much more than instrumental music does (see [research.md](research.md)).

## Making a sound effect: `sfx_plane.py`

`tools/sfx_plane.py out.wav [duration] [whoosh.wav]` synthesizes a jet flyby (rumble, roar, turbine whine with a Doppler drop, left-to-right pan), optionally layered with a recorded whoosh. It's kept as an example of building a missing sound, but the lesson was the opposite: the recorded plane sounded better. Prefer recordings.
