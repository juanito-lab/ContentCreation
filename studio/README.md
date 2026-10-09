# studio/ (Remotion project)

The video renderer. You rarely need to touch it: `tools/make.sh` renders specs with it. Open it when you want to see a spec live or add a feature.

```bash
npm run dev        # Remotion Studio on http://localhost:3000
npm run lint       # ESLint + TypeScript
```

## Compositions

| Id | File | What it is |
|---|---|---|
| **Short** | `src/Short.tsx` | **The main one.** A vertical video built from a JSON spec (scenes, words, media, counters, climax) with automatic sound design. `tools/make.sh` renders this. Every field: [docs/spec-reference.md](../docs/spec-reference.md). |
| Demo | `src/examples/demo/` | A 9 s hand-coded reference edit (hook, rising number, squiggle outro) from Jasper Kallfelz's shortform-edit-kit. Times come from `timing.ts`. No media needed. |
| FounderMix | `src/examples/founder-mix/FounderMix.tsx` | Case study: the 12-beat MantAI founder reel. Needs personal media in `public/mix/` and `public/vo/` (git-ignored). |
| FounderIntro | `src/examples/founder-mix/FounderIntro.tsx` | Case study: its first draft; FounderMix reuses its beats (avatar grid, photo wall, alert card, squiggle). |

## Shared code (`src/lib/`)

| File | What it does |
|---|---|
| `fonts.ts` | Loads the three bundled faces (Inter Tight, Libre Caslon Display, Great Vibes) from `public/fonts` |
| `words.tsx` | The word layer: each word has a font, size, position (% of the frame) and the frame it cuts in on |
| `sfx.tsx` | The sound catalogue (`SOUNDS`: file, length, lead, loudness) and `SfxTrack`, which plays a list of cues as named sequences |
| `safezones.tsx` | The red overlay of the areas TikTok / Reels cover with their UI |

## Assets (`public/`)

| Folder | Contents |
|---|---|
| `sfx/` | 61 real recorded sound effects, trimmed and measured; sources and licences in `sfx/CREDITS.md` |
| `fonts/` | the three faces as woff2 (SIL Open Font License) |
| `music/` | an original synthesized music bed (`tools/music_bed.py`) |
| `v/<id>/` | created by `make.sh` for each render (git-ignored) |
| `mix/`, `vo/` | personal media for the case study (git-ignored) |

## Adding a beat type to Short

Add an optional field to `sceneSpec` (zod, with defaults for every string), render it in `SceneView`, give it sound cues in `buildCues`, then document it in `docs/spec-reference.md`. Port visuals from `src/examples/founder-mix/` rather than writing a new composition per video.
