# Voiceover

The voice is recorded **first** and everything else is timed to it. This page covers recording, choosing a take, cleaning it, and turning it into scene durations and word times.

## 1. Record with voice-coach

[voice-coach](https://github.com/juanito-lab/voice-coach) is a local recording studio in the browser (Chrome on macOS). Paste the approved script; it directs every line (pace, energy, pauses, emphasis) and shows one line at a time while you record.

- **Pick your mic** in the Mic menu and run **Check level** once per mic. USB mics like a Shure MVX2U read around −32 dBFS on a normal read until the level check sets a gain.
- Record **three takes at most**. More takes don't get better; they get tired.
- Every take stays in the takes list with its loudness (LUFS), noise floor, % of time in the green, clipped peaks and pace. The ★ marks the best take (no clipping, noise floor ≤ −50 dBFS, loudness within ±6 LU of −16 LUFS, ≥ 90% of the script reached, then most time in the green).
- Download the best take's **`.wav`** and **`.lines.json`**. The lines file maps every script line to where it was spoken in the take: exactly the input `voice_assemble.py` needs.

### Picking a take by numbers

From the first real video (five takes of the same script):

| What | Good | Bad |
|---|---|---|
| Integrated loudness | about −16 LUFS (take 5: −16.7) | −23 to −27 LUFS: too quiet, the noise comes up with the gain |
| Noise floor | below −55 dB (best: −57) | above −50: audible room noise |
| Clipping | none | peaks at 0 dBFS (the chain below can rescue 0.2 dBFS, not more) |

Then listen. Numbers find the usable takes; your ear picks the one with the energy.

## 2. Clean, level, tighten: `voice_assemble.py`

```bash
python3 tools/voice_assemble.py take.wav videos/<id>/vo.wav videos/<id>/plan.json take.lines.json 1.08 0.22 0.22
#                               raw take  voiceover out         time map out          lines        tempo maxgap tail
```

What it does, in order:

1. **Clean-up chain:** high-pass 80 Hz, low-pass 15 kHz, noise reduction (`afftdn`), de-esser, compressor 2.5:1.
2. **Tempo:** `atempo 1.08` makes it 8% faster at the same pitch. It still sounds natural and fixes "a bit slow".
3. **Level:** loudnorm to −16 LUFS, −1.5 dBTP.
4. **Assemble:** keeps only the listed chunks, in script order. Pauses inside a line are capped at `maxgap` (0.22 s); each line gets a `tail` of silence (0.22 s). The first real take went from 52 s raw to 37.5 s.
5. **Plan:** writes `plan.json` with the start and length of every line in the new file, and a map from source time to new time.

### lines.json

One entry per script line; each entry is a list of `[start, end]` chunks in the raw take's seconds. A line voice-coach never reached is an empty list `[]` (it stays empty in the plan, no audio is added).

```json
[
  [[0.84, 3.05]],
  [[3.77, 4.81], [5.89, 6.48], [7.48, 7.98]],
  [{"stutter": [28.03, 28.15], "n": 2, "gap": 0.06}, [28.03, 29.25]]
]
```

- Several chunks in one line = keep only those parts (drops "uh"s, false starts and retakes).
- `{"stutter": [a, b], "n": 2}` repeats a short slice before the next chunk: "t-t-two weeks later". Use it once per video, at most.
- The full voice-coach timing file (an object with a `chunks` key) is accepted too.

### No voice-coach file? Map the take yourself

```bash
python3 tools/voice_chunks.py take.webm --words
```

It splits the take at pauses, transcribes each chunk offline with PocketSphinx and prints word start times. The text is rough ("call found it" = "co-founder") but it's enough to tell which script line a chunk is, and to spot retakes (in take 5 "I'm Juan" was said twice; keep the second). Tune with `--noise -32` (silence threshold in dB) and `--min-pause 0.18`.

## 3. Word times: `words.py`

```bash
python3 tools/words.py videos/<id>/vo.wav > videos/<id>/words.json
```

Prints `[{"w": "word", "t": 0.42, "end": 0.61}, ...]` for the **assembled** voiceover. It uses faster-whisper when installed (accurate; downloads a model once from Hugging Face) and PocketSphinx otherwise (offline, rough words, usable times). Force one with `--engine whisper` or `--engine sphinx`.

## 4. From the voice to the spec

- **Scene durations:** `dur[i] = lines[i+1].start − lines[i].start` from `plan.json`. The last scene = voiceover length − its start + ~0.3 s. Round to frames (1/30 s) if you like; `make.sh` rounds anyway.
- **Word times:** each word's `t` = its time in `words.json` − the scene's start. It appears 0.1 s before that.
- **Cuts inside a beat** (a second clip, a card swap): put them on a word too. Every cut lands on a word.
- `check_spec.py` warns when the scenes don't add up to the voiceover (more than 0.5 s off).

## 5. Mix levels

| Layer | Level |
|---|---|
| Voice (`voVolume`) | **0.45–0.6**. It sits lower than you think: "too loud" came up three times on the first video |
| Sound effects (`sfxVolume`) | 1.3–1.5 |
| Music (`musicVolume`) | about 10 LU under the voice; 0.15 is a good start |
| Master | `make.sh` normalises the final file to −14 LUFS (TikTok / Reels playback level) with a −1.5 dBFS peak limiter |

Because the master is normalised afterwards, lowering the voice doesn't make the video quieter; it only changes the balance against effects and music.

## Never

- Time a video to a guide voice or TTS "for now". The real take always has a different rhythm.
- Put vocals under the voice. Instrumental only, or nothing (see [sound-and-music.md](sound-and-music.md)).
