# Spec reference (`videos/<id>/spec.json`)

One JSON file describes one video. `tools/make.sh` renders it with the `Short` composition (`studio/src/Short.tsx`, where the schema lives). Every field below has a default unless it says **required**. Times are in **seconds**, positions in **% of the frame**, the frame is **1080 × 1920 at 30 fps**.

`tools/check_spec.py videos/<id>` validates a spec without rendering; `make.sh` runs it first.

## Top level

| Field | Type | Default | Meaning |
|---|---|---|---|
| `scenes` | array | **required** | The beats, in order. The video length is the sum of their `dur`. |
| `voiceover` | string | `""` | Voice file name (wav/mp3/m4a), in the video folder or `library/`. `""` = no voice. |
| `voVolume` | 0–1 | `1` | Voice level in the mix. **0.45–0.6 works**: the master is normalised to −14 LUFS afterwards, so this only sets the voice against SFX and music. |
| `music` | string | `""` | Music file name. `""` = none; add a sound in the app instead (no copyright risk). |
| `musicVolume` | 0–1 | `0.15` | Music level. It drops to 15% for 0.5 s before the climax and fades out over the last 18 frames. |
| `sfxVolume` | 0–2 | `1.3` | Master fader for all sound effects. |
| `autoSfx` | bool | `true` | Automatic sound design (see below). `false` = only the hand-placed `sfx` cues. |
| `theme.bg` | colour | `#ffffff` | Background of scenes without full-bleed media. |
| `theme.ink` | colour | `#000000` | Default text colour on light backgrounds. Over full-bleed media text is white with a shadow. |
| `theme.accent` | colour | `#E10600` | Default colour of `script` words. |
| `theme.accent2` | colour | `#12b76a` | Default colour of counters. |
| `covers` | array of frames | 3 frames: start, middle, end | Frames exported as `cover-<frame>.png`. The **first** one is also the cover frame when posting. |
| `post.caption` | string | `""` | Caption text. Written to `out/caption.txt` and posted exactly as written. |
| `post.hashtags` | array of strings | `[]` | Appended after a blank line as `#tag` (with or without the `#`). Max 5 for Instagram. |
| `safeZones` | bool | `false` | Draw the app-UI areas in red. `make.sh --preview` turns it on; never set it for a real render. |

## Scene

| Field | Type | Default | Meaning |
|---|---|---|---|
| `dur` | seconds | **required** | Scene length. Take it from the voice plan: the gap between this line's start and the next one's. |
| `name` | string | `""` | Label in Studio's timeline, in check messages and in preview file names. |
| `bg` | colour | theme bg | Background colour for this scene only. |
| `media` | object | none | One clip or image (below). |
| `words` | array | `[]` | Text that appears during the scene (below). |
| `counter` | object | none | A number that counts up (below). |
| `climax` | bool | `false` | The emotional peak. Mark **one** scene. Music drops out 0.5 s before it, a riser ends exactly on its first frame, a drum hits on it. |
| `sfx` | array | `[]` | Extra sound cues: `{ "t": 1.2, "s": "shutterBurst3", "vol": 0.06 }` (`t` from scene start, `s` a name from the list below, `vol` 0–1, default 0.08). |

## Media

| Field | Type | Default | Meaning |
|---|---|---|---|
| `file` | string | **required** | mp4 / mov / webm or png / jpg / webp, in the video folder or `library/`. |
| `layout` | `full` / `inset` / `tall` | `inset` | `full` = full-bleed 9:16 (cropped to cover, a dark gradient at top and bottom, white text). `inset` = rounded 16:9 card, 86% wide. `tall` = rounded 4:5 card, 74% wide, for people. |
| `startSec` | seconds | `0` | Where to start inside the clip. The clip starts playing on the scene's first frame. |
| `top` | % | `40` | Top edge of the card (`inset` / `tall` only). |
| `zoom` | ≥ 1 | `1.08` | Slow push-in across the whole scene. `1` = none. |
| `origin` | CSS position | `"50% 50%"` | Point the zoom moves towards, e.g. `"50% 30%"` for a face. |
| `sound` | bool | `false` | Play the clip's own audio. |
| `soundVolume` | 0–1 | `0.6` | Level of the clip's own audio. |

Cards spring in (scale 0.92 → 1 and a 4-frame fade). Prepare phone footage with `tools/media_prep.py` first (rotation, HDR, size); see [media.md](media.md).

## Word

| Field | Type | Default | Meaning |
|---|---|---|---|
| `text` | string | **required** | The words. One line; no wrapping. Use several words for a stack. |
| `t` | seconds | **required** | When it's spoken, from the scene start. It **appears 0.1 s earlier** with a hard cut, so it is on screen as it's said. |
| `until` | seconds | `0` | When it disappears, from the scene start. `0` = at the end of the scene. |
| `font` | `sans` / `serif` / `script` | `sans` | `sans` = Inter Tight bold (names, numbers, hero words). `serif` = Libre Caslon Display (connectors, elegant lines). `script` = Great Vibes (the one emotional word per beat). `sansLight` and `serifItalic` are older names for `serif`. |
| `size` | px | `120` | Font size on the 1080 px wide frame. Typical: line 80–90, punch word 140–180, script word 280–400. Script sets small for its size (it's scaled ×1.12). |
| `x`, `y` | % | `50`, `20` | Centre of the word. |
| `color` | colour | see `theme` | `""` = accent for `script`, ink (or white over full-bleed media) for the rest. |
| `weight` | number | `0` | Font weight for `sans` only. Only 700 is bundled, so prefer `stroke` for heavier text. |
| `stroke` | CSS | `""` | Faux-bold outline in the text colour, e.g. `"3px #ffffff"`. |
| `rotate` | degrees | `0` | Tilt. |

Words don't animate: they cut in and stand still. That reads better over fast footage than pops and bounces.

### Where text may go (safe zones)

TikTok and Reels cover parts of the frame with their own UI. **Text stays inside y 220–1470 px (11.5%–76.5%)**, and between 45% and 80% of the height it also stays left of x 945 px (87.5%). Photos and footage may run under the UI; text may not. Details and fixes: [look-and-safe-zones.md](look-and-safe-zones.md).

## Counter

| Field | Type | Default | Meaning |
|---|---|---|---|
| `to` | number | **required** | Final value. |
| `from` | number | `0` | Start value. |
| `t` | seconds | `0.3` | When it starts counting. |
| `mode` | `land` / `rise` | `land` | `land` eases out and stops on the exact value 0.6 s before the cut. `rise` accelerates and is still climbing on the cut. |
| `prefix`, `suffix` | string | `""` | e.g. `"$"`, `"/day"`. |
| `y` | % | `50` | Vertical centre. |
| `size` | px | `170` | Font size. |
| `color` | colour | theme accent2 | |

Numbers are formatted with thousands separators (`1,000,000`).

## Automatic sound design (`autoSfx: true`)

Every visual event gets one real recorded sound, timed to the same frame:

| Event | Sound | Level (`vol`) |
|---|---|---|
| A `sans` or `serif` word appears | key tap, rotating `key1`, `key2`, `key3` | 0.07 |
| A `script` word appears | pencil stroke `pencil1` | 0.04 |
| Full-bleed media appears | `shutterInsta2` | 0.06 |
| A card (`inset` / `tall`) appears | `shutterSlr3` | 0.085 |
| A cut into a normal scene | page turn `page1` | 0.10 |
| The cut into the climax | drum `tom1` on the cut + reversed-cymbal `riser1` ending exactly on it | 0.13 / 0.06 |
| A counter ticks | split-flap `flapLo` / `flap` / `flapHi` every 3 frames, getting louder | 0.02 → 0.05 |

The `vol` values set the balance between sounds; `sfxVolume` sets them all at once. Sources and licences: `studio/public/sfx/CREDITS.md`.

### Sound names for `sfx` cues

`shutter2 shutter3 shutterSlr2 shutterSlr3 shutterInsta1 shutterInsta2 shutterOld shutterDslr shutterBurst2 shutterBurst3 shutterBurst4 winder1 winder2` (cameras) ·
`mouse1 mouse2 mouse3 mouse4 trackpad1 trackpad2 switch switch2 switch3 pen1 pen2 pen3 pen_click` (clicks) ·
`key1 key2 key3` (typing) · `pencil1 pencil2` (writing) ·
`flap flapLo flapHi flapBurst3 flapBurst5 flapBurst8 flapEnd1 flapEnd2 flapRun` (split-flap board) ·
`page1 page2 page3 page_turn_single pages_flip_multi tear road_map_unfold riffle1 cardPlace1` (paper, cards) ·
`swish swishSmall whooshShort whoosh_rope` (whooshes) · `riser1 tom1 clink1` (riser, drum, glass) ·
`plane_whoosh airplanePass airplane_pass1_flyby crowd_yeah_applause` (planes, crowd)

An `sfx` cue's `t` is where the sound's hit lands. For whooshes and paper that's their loudest point (the file's `lead`), so a whoosh on a cut starts a little before it.

## A complete example

```json
{
  "voiceover": "vo.wav",
  "voVolume": 0.6,
  "music": "",
  "sfxVolume": 1.3,
  "theme": { "bg": "#ffffff", "ink": "#000000", "accent": "#E10600", "accent2": "#12b76a" },
  "scenes": [
    {
      "name": "Hook", "dur": 2.4,
      "media": { "file": "hook.mp4", "startSec": 1.0, "layout": "full", "zoom": 1.08 },
      "words": [
        { "t": 0.10, "text": "I left Zürich", "font": "sans", "size": 150, "x": 50, "y": 30 },
        { "t": 1.05, "text": "to chase my", "font": "serif", "size": 90, "x": 50, "y": 40 },
        { "t": 1.63, "text": "dream", "font": "script", "size": 320, "x": 50, "y": 50 }
      ]
    },
    {
      "name": "Cost", "dur": 3.0,
      "words": [ { "t": 0.1, "text": "one breakdown costs", "font": "serif", "size": 80, "x": 50, "y": 32 } ],
      "counter": { "t": 0.5, "to": 760, "prefix": "$", "suffix": "/day", "y": 48 }
    },
    {
      "name": "Payoff", "dur": 3.4, "climax": true,
      "media": { "file": "device.jpg", "layout": "tall", "top": 30 },
      "words": [ { "t": 0.2, "text": "And it works.", "font": "sans", "size": 130, "x": 50, "y": 22 } ],
      "sfx": [ { "t": 1.4, "s": "clink1", "vol": 0.06 } ]
    }
  ],
  "covers": [45, 140],
  "post": {
    "caption": "Two weeks from idea to our first device on a real car. What would you build first?",
    "hashtags": ["buildinpublic", "startup", "hardware"]
  }
}
```

## Missing a beat type?

`Short` covers text stacks, full-bleed footage, cards, counters and the climax. The founder reel also used a travel map, an avatar grid, a photo wall, an alert card and a squiggle outro; those live as hand-coded beats in `studio/src/examples/founder-mix/`. When you need one, **port it into `Short` as a new optional scene field** (with a zod schema and defaults) instead of writing a new composition. Then document it here.
