# Getting started

From zero to your first rendered video. About 20 minutes, most of it installing.

## 1. What you need

| Need | Why |
|---|---|
| macOS or Linux (a laptop, a VPS, or an agent's container) | Windows works through WSL2 but isn't tested |
| Node.js 20+ | Remotion (the video renderer) runs on Node |
| ffmpeg with libx264 | encoding, loudness measurement, media prep |
| Python 3.9+ with numpy, scipy, pillow, pocketsphinx | voice tools, contact sheets, music bed, word timings |
| ~2 GB free disk | node packages + Remotion's headless Chrome |
| Optional: yt-dlp | downloading reference reels (`tools/grab.sh`) |
| Optional: faster-whisper | more accurate word timings than PocketSphinx |
| Optional: a [Zernio](https://zernio.com) account | posting to Instagram and TikTok from the command line |

## 2. Install

```bash
git clone https://github.com/juanito-lab/ContentCreation && cd ContentCreation
bash setup.sh              # or: bash setup.sh --whisper
tools/doctor.sh            # one line per tool: ok / MISSING / optional
```

`setup.sh` installs the system packages (Homebrew on macOS, apt on Linux), the studio's npm packages and Remotion's headless Chrome, creates `library/` and `refs/`, and renders three preview stills of `videos/example` as a smoke test.

If Remotion can't download its Chrome (some servers block it), point it at any Chrome or Chromium headless shell:

```bash
export REMOTION_BROWSER=/path/to/chrome-headless-shell     # every tool picks this up
```

## 3. Render the example

```bash
tools/make.sh videos/example --preview     # ~15 s: one still per scene, with the safe zones in red
tools/make.sh videos/example               # ~1 min: the real mp4
open videos/example/out/                   # macOS; on Linux use xdg-open or look at the files
```

You get `example_1080x1920.mp4`, a cover image, `caption.txt` and `render.json`. The example is text-only (no media), so it works on a fresh clone.

## 4. Open the studio (optional, but useful)

```bash
cd studio && npm run dev                   # Remotion Studio on http://localhost:3000
```

Pick the **Short** composition. The right panel shows every spec field; change one and the preview updates. This is the fastest way to learn what each field does. `FounderMix` and `FounderIntro` are the case-study compositions and show missing-file errors until you add your own media (they are hand-coded examples, not templates).

## 5. Make it yours

1. **`CREATOR.md`**: replace the maintainer's profile with yours: handle, platforms, who approves posts, voice rules, colours. The agent skills read it before every video.
2. **`library/`**: put your edit-ready clips and photos here and copy `library/LIBRARY.template.md` to `library/LIBRARY.md`. Write one line per file. Everything in `library/` is git-ignored.
3. **`videos/_template/spec.json`**: change the theme colours and the `@yourhandle` line to your defaults.
4. **Posting (optional)**: `cp .env.example .env`, add your `ZERNIO_API_KEY`, see [posting.md](posting.md).

## 6. Your first real video, in 8 commands

The full reasoning is in [workflow.md](workflow.md); this is the short version.

```bash
tools/grab.sh "https://www.instagram.com/reel/..."          # 1. a reference reel → refs/ (+ contact sheet, audio)
#                                                              2. write the script + caption (one line per beat)
#                                                              3. record it in voice-coach → take.wav + take.lines.json
tools/new_video.sh 2026-10-12-first-pilot                     # 4. new folder from the template
python3 tools/voice_assemble.py take.wav videos/2026-10-12-first-pilot/vo.wav \
        videos/2026-10-12-first-pilot/plan.json take.lines.json 1.08 0.22 0.22   # 5. clean, level, tighten the voice
python3 tools/words.py videos/2026-10-12-first-pilot/vo.wav > videos/2026-10-12-first-pilot/words.json
#                                                              6. edit spec.json: scene durations + word times from words.json
tools/make.sh videos/2026-10-12-first-pilot --preview         # 7. stills with safe zones: fix until clean
tools/make.sh videos/2026-10-12-first-pilot                   # 8. render
python3 tools/post.py approve videos/2026-10-12-first-pilot   #    then post (docs/posting.md)
```

## 7. Where to go next

- [workflow.md](workflow.md): the whole process and why each step is where it is
- [spec-reference.md](spec-reference.md): every field of `spec.json`
- [agents.md](agents.md): let Claude Code or Hermes do most of this for you
- [troubleshooting.md](troubleshooting.md): when something fails
