# Media: footage, photos and references

## Keep a library

The first video spent hours finding and identifying the same clips three times. Fix it once:

```
library/
  LIBRARY.md     one line per file (copy LIBRARY.template.md)
  inbox/         new material lands here first
  hook.mp4 ...   edit-ready media
```

A spec names a file (`"file": "hook.mp4"`) and `make.sh` looks in the video folder first, then in `library/`. Everything in `library/` is git-ignored: your media never goes into this public repo.

**Rule:** a file gets its line in `LIBRARY.md` (what it is, who's in it, orientation and length, where it was used) before it's used. Then "find a shot of the device on the dashboard" takes ten seconds, for you or an agent.

## Pick from contact sheets, not file names

Phones name everything `IMG_1234`. Look at the pictures instead:

```bash
python3 tools/contact_sheet.py ~/Downloads/phone-dump refs/sheet --tile 240 --per 60
```

It writes numbered sheets of 60 thumbnails (`refs/sheet-0.jpg`, `-1.jpg`, …) plus `refs/sheet-list.txt` (number → file). 507 phone files fit on 9 sheets. Photos get their EXIF rotation; videos show the frame at 1.5 s.

To check that a person stays in frame during a clip, make a strip of 5 frames across its length:

```bash
ffmpeg -i clip.mov -vf "fps=5/DURATION,scale=-2:220,tile=5x1" -frames:v 1 strip.jpg
```

**Confirm who is who** with one reference photo per person before building beats around them. The first cut showed the wrong person as the co-founder because "the one with long hair" was ambiguous.

## Prepare phone originals: `media_prep.py`

```bash
python3 tools/media_prep.py ~/Downloads/phone-dump library/ jobs.json
```

`jobs.json` lists what to cut: `[output name, source file, start s, duration s]`.

```json
[
  ["hook.mp4",  "IMG_2486.MOV", 1,   5],
  ["duo.jpg",   "IMG_5641.jpeg", 0,  0],
  ["w14.jpg",   "IMG_9670.MOV", 1.5, 0]
]
```

- **Photos:** EXIF rotation applied (phones store many photos sideways and plain ffmpeg ignores the flag), max 1600 px, JPEG.
- **Videos:** cut to `[start, start + duration]`, max 1080 px on the short side, 30 fps, H.264, no audio.
- **iPhone HDR** (HLG or PQ) is tone-mapped to SDR, or it looks washed out. SDR clips are **not** tone-mapped (that would darken them): the script checks `color_transfer` first. Tone-mapping needs ffmpeg with `zscale` (`tools/doctor.sh` tells you).
- **A still from a video:** name the output `.jpg` and give a video source; it grabs one frame at `start`.

## References from other creators: `grab.sh`

```bash
tools/grab.sh "https://www.tiktok.com/@someone/video/123" [dest-folder]
```

Downloads the video with yt-dlp (Instagram, TikTok, YouTube Shorts, X) into `refs/` with its `.info.json` (caption, author), a contact sheet at 2 frames per second (`-sheet.jpg`) and a 16 kHz mono `.wav` for word timings. `refs/` is git-ignored.

**A reference is for structure only.** Their footage, audio, handle and watermark never appear in your video. Instagram shows reels less when they're reposts or carry another app's watermark, and re-posting someone's footage needs their permission.

## Generated scenes instead of footage

When you don't have footage for a beat, use a text card, a counter, or a card with a screenshot. Never fill it with someone else's clip. Every beat still needs motion: a slow zoom on a photo, a counter, words cutting in.
