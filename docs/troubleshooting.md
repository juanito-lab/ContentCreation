# Troubleshooting

Run `tools/doctor.sh` first: most problems are a missing tool.

## Rendering

| Problem | Cause and fix |
|---|---|
| `Could not find a browser` / Chrome download fails | Remotion downloads its own headless Chrome; some servers block it. Install any Chrome or Chromium headless shell and `export REMOTION_BROWSER=/path/to/it`. |
| `error while loading shared libraries: libnss3.so` (Linux) | Chrome's system libraries are missing: `bash setup.sh` installs them (or the `apt-get install` line in it). |
| `media file not found in the video folder or library/` | The spec names a file that isn't in `videos/<id>/` or `library/`. Names are case-sensitive. |
| The render looks right but text is under the TikTok buttons | Run `tools/make.sh videos/<id> --preview` and look at the red areas; keep text inside y 220–1470 px. |
| A clip starts in the middle | `startSec` is where the clip starts inside the file; it plays from the scene's first frame. In hand-built compositions, wrap a card's clip in `<Sequence from={cardStart}>`. |
| Phone photos are sideways | Run them through `tools/media_prep.py` (applies the EXIF rotation). |
| iPhone clips look washed out | They're HDR: `tools/media_prep.py` tone-maps them (needs ffmpeg with `zscale`). |
| Fonts look wrong on a server | Fonts must be local: only the woff2 files in `studio/public/fonts` are used. |
| `warning: the mix is very quiet` | No voice and quiet effects (e.g. a text-only video). The master gain is capped at +10 dB; add a voice or music, or raise `sfxVolume`. |
| Render is slow | ~1 minute per 10 s of video on a laptop. Check stills first (`--preview`) so you only render once. |

## Voice

| Problem | Fix |
|---|---|
| `No module named pocketsphinx` | `pip install pocketsphinx` (`--break-system-packages` on newer Linux). |
| `words.py` downloads a model / hangs | That's faster-whisper fetching its model from Hugging Face. Offline? Use `--engine sphinx`. |
| `voice_chunks.py` finds one giant chunk | The room is too loud for the silence threshold: try `--noise -28`. Too many tiny chunks: `--min-pause 0.25`. |
| The voice sounds "pumpy" | Too much noise reduction on a noisy take. Record in a quieter room; the chain can't fix a −45 dB noise floor. |
| The scenes don't match the voice | `check_spec.py` warns when they're more than 0.5 s apart. Recompute `dur` from `plan.json`. |

## Posting

See the table in [posting.md](posting.md#when-something-goes-wrong). The short version: re-approve after any change, never paste the API key anywhere but `.env`, and never retry a timed-out publish before checking `post.py status`.

## Studio

| Problem | Fix |
|---|---|
| `FounderMix` / `FounderIntro` show missing files | Expected on a fresh clone: they're case studies that need the creator's own media in `studio/public/mix/` and `studio/public/vo/`. Use `Short`. |
| The props panel crashes on a text field | Give every optional string in a zod schema `.default("")`. |
| Can't open Studio on a remote server | Bundle it (`npx remotion bundle --public-path=./`) and open the folder as a static site, or forward the port over SSH (`ssh -L 3000:localhost:3000 server`). |
