// Short: a vertical video (1080x1920, 30 fps) built entirely from a JSON spec.
// An agent writes videos/<id>/spec.json, make.sh renders it. No code changes per video.
//
// Spec = list of scenes. Each scene: duration, optional media (clip or image, as inset card or full-bleed),
// words that pop in at given times, optional counting number. Sound design is added automatically
// from the same timings (keys on words, pencil on script words, shutter on media, page/drum on cuts,
// flaps on counters, riser into the climax), using only the real recorded SFX from the kit.
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { FONTS } from "./lib/fonts";
import { Words, WHITE_SHADOW } from "./lib/words";
import type { Word } from "./lib/words";
import { SfxTrack, SOUNDS } from "./lib/sfx";
import type { Cue, SoundName } from "./lib/sfx";

export const FPS = 30;
const fr = (sec: number) => Math.round(sec * FPS);

const fontEnum = z.enum(["sans", "sansLight", "serifItalic", "script"]);

const wordSpec = z.object({
  /** seconds from scene start (pop-in happens 0.1 s earlier so the word is fully there when spoken) */
  t: z.number().min(0),
  text: z.string(),
  font: fontEnum.default("sans"),
  size: z.number().positive().default(120),
  /** centre position in % of width / height */
  x: z.number().default(50),
  y: z.number().default(20),
  /** "" = theme ink (or white over full-bleed video) */
  color: z.string().default(""),
  /** 0 = font default */
  weight: z.number().default(0),
  rotate: z.number().default(0),
});

const mediaSpec = z.object({
  /** file name inside the video folder (mp4/mov/webm or png/jpg/webp) */
  file: z.string(),
  /** where to start inside the clip, in seconds */
  startSec: z.number().min(0).default(0),
  /** inset = rounded 16:9 card on the background, full = full-bleed 9:16 (cover), tall = rounded 4:5 card */
  layout: z.enum(["inset", "full", "tall"]).default("inset"),
  /** top edge of the card in % of height (inset / tall only) */
  top: z.number().default(40),
  /** slow zoom over the scene, e.g. 1.12; 1 = none */
  zoom: z.number().min(1).default(1.08),
  /** zoom origin inside the media, e.g. "50% 30%" to zoom towards a face */
  origin: z.string().default("50% 50%"),
  /** play the clip's own sound (default muted) */
  sound: z.boolean().default(false),
  soundVolume: z.number().min(0).max(1).default(0.6),
});

const counterSpec = z.object({
  t: z.number().min(0).default(0.3),
  to: z.number(),
  from: z.number().default(0),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  y: z.number().default(50),
  size: z.number().default(170),
  /** "" = theme accent2 */
  color: z.string().default(""),
  /** "rise" keeps climbing until the cut, "land" eases out and stops on the exact value */
  mode: z.enum(["rise", "land"]).default("land"),
});

const sfxSpec = z.object({ t: z.number().min(0), s: z.string(), vol: z.number().min(0).max(1).default(0.08) });

const sceneSpec = z.object({
  name: z.string().default(""),
  /** seconds */
  dur: z.number().positive(),
  /** "" = theme bg */
  bg: z.string().default(""),
  media: mediaSpec.optional(),
  words: z.array(wordSpec).default([]),
  counter: counterSpec.optional(),
  /** the emotional peak: music dips before it, riser into it, drum on its first frame */
  climax: z.boolean().default(false),
  /** extra hand-placed sound cues (s = name from the SFX catalogue) */
  sfx: z.array(sfxSpec).default([]),
});

export const shortSchema = z.object({
  /** folder prefix under public/ (make.sh sets this to "v/<id>/") */
  base: z.string().default(""),
  voiceover: z.string().default(""),
  voVolume: z.number().min(0).max(1).default(1),
  music: z.string().default(""),
  musicVolume: z.number().min(0).max(1).default(0.15),
  sfxVolume: z.number().min(0).max(2).default(1.3),
  autoSfx: z.boolean().default(true),
  theme: z
    .object({ bg: z.string().default("#ffffff"), ink: z.string().default("#000000"), accent: z.string().default("#e1251b"), accent2: z.string().default("#12b76a") })
    .default({ bg: "#ffffff", ink: "#000000", accent: "#e1251b", accent2: "#12b76a" }),
  scenes: z.array(sceneSpec).min(1),
});
export type ShortProps = z.input<typeof shortSchema>;
type Spec = z.output<typeof shortSchema>;
type Scene = z.output<typeof sceneSpec>;
type Media = z.output<typeof mediaSpec>;

const sceneStarts = (scenes: { dur: number }[]) => {
  const out: number[] = [];
  let acc = 0;
  for (const s of scenes) {
    out.push(acc);
    acc += fr(s.dur);
  }
  return { starts: out, total: acc };
};

export const calculateShortMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => {
  const spec = shortSchema.parse(props);
  return { durationInFrames: Math.max(1, sceneStarts(spec.scenes).total), props: spec };
};

const isImage = (f: string) => /\.(png|jpe?g|webp|gif)$/i.test(f);
const src = (base: string, file: string) => staticFile(base + file);

// ------------------------------------------------------------------ media
const MediaFill: React.FC<{ m: Media; base: string }> = ({ m, base }) =>
  isImage(m.file) ? (
    <Img src={src(base, m.file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <OffthreadVideo src={src(base, m.file)} muted={!m.sound} volume={m.soundVolume} trimBefore={fr(m.startSec)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  );

const MediaBlock: React.FC<{ m: Media; base: string; frames: number }> = ({ m, base, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = interpolate(frame, [0, frames], [1, m.zoom], { extrapolateRight: "clamp" });
  const inner = (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: m.origin }}>
      <MediaFill m={m} base={base} />
    </AbsoluteFill>
  );
  if (m.layout === "full") return <AbsoluteFill>{inner}</AbsoluteFill>;
  const sp = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const width = m.layout === "tall" ? 74 : 86;
  return (
    <div
      style={{
        position: "absolute",
        left: `${(100 - width) / 2}%`,
        top: `${m.top}%`,
        width: `${width}%`,
        aspectRatio: m.layout === "tall" ? "4 / 5" : "16 / 9",
        transform: `scale(${interpolate(sp, [0, 1], [0.92, 1])})`,
        opacity: interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
        boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
        borderRadius: 28,
        overflow: "hidden",
        background: "#dfe3ea",
      }}
    >
      {inner}
    </div>
  );
};

// ------------------------------------------------------------------ counter
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const Counter: React.FC<{ c: z.output<typeof counterSpec>; frames: number; color: string }> = ({ c, frames, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = fr(c.t);
  const local = frame - at;
  if (local < 0) return null;
  const span = Math.max(1, frames - at - (c.mode === "land" ? fr(0.6) : 0));
  const p = Math.min(1, local / span);
  const eased = c.mode === "rise" ? Math.pow(p, 2.3) : 1 - Math.pow(1 - p, 3);
  const value = c.from + (c.to - c.from) * eased;
  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `${c.y}%`,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(-50%) scale(${interpolate(pop, [0, 1], [0.8, 1])})`,
        opacity: interpolate(local, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
        color,
        fontSize: c.size,
        lineHeight: 1,
        ...FONTS.sans,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {c.prefix}
      {fmt(value)}
      {c.suffix}
    </div>
  );
};

// ------------------------------------------------------------------ scene
const TEXT_LEAD = 0.1;
const SceneView: React.FC<{ s: Scene; spec: Spec; frames: number }> = ({ s, spec, frames }) => {
  const full = s.media?.layout === "full";
  const words: Word[] = s.words.map((w) => ({
    text: w.text,
    at: Math.max(0, fr(w.t - TEXT_LEAD)),
    font: w.font,
    size: w.size,
    x: w.x,
    y: w.y,
    color: w.color || undefined,
    weight: w.weight || undefined,
    rotate: w.rotate || undefined,
  }));
  return (
    <AbsoluteFill style={{ background: s.bg || spec.theme.bg }}>
      {s.media ? <MediaBlock m={s.media} base={spec.base} frames={frames} /> : null}
      {full ? <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.45) 100%)" }} /> : null}
      {s.counter ? <Counter c={s.counter} frames={frames} color={s.counter.color || spec.theme.accent2} /> : null}
      <Words words={words} color={full ? "#fff" : spec.theme.ink} shadow={full ? WHITE_SHADOW : undefined} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ automatic sound design
const KEYS: SoundName[] = ["key1", "key2", "key3"];
const FLAPS: SoundName[] = ["flapLo", "flap", "flapHi"];
const FLAP_ORDER = [1, 0, 2, 0, 1, 2, 0];

const buildCues = (spec: Spec, starts: number[]): Cue[] => {
  const cues: Cue[] = [];
  let k = 0;
  spec.scenes.forEach((s, i) => {
    const st = starts[i];
    const frames = fr(s.dur);
    const label = s.name || `scene ${i + 1}`;
    if (spec.autoSfx) {
      if (s.climax) {
        cues.push({ at: st, s: "tom1", vol: 0.13, name: `${label} (drum)` });
        const riserAt = st - fr((SOUNDS.riser1.len - SOUNDS.riser1.lead) / 1000);
        if (i > 0 && riserAt > 0) cues.push({ at: riserAt, s: "riser1", vol: 0.06, name: `${label} (riser)` });
      } else if (i > 0) {
        cues.push({ at: st, s: "page1", vol: 0.1, name: `${label} (cut)` });
      }
      if (s.media) cues.push({ at: st, s: s.media.layout === "full" ? "shutterInsta2" : "shutterSlr3", vol: s.media.layout === "full" ? 0.06 : 0.085, name: `${label} (media)` });
      for (const w of s.words) {
        const at = st + Math.max(0, fr(w.t - TEXT_LEAD));
        if (w.font === "script") cues.push({ at, s: "pencil1", vol: 0.04, name: `${w.text} (pencil)` });
        else cues.push({ at, s: KEYS[k++ % KEYS.length], vol: 0.07, name: `${w.text} (key)` });
      }
      if (s.counter) {
        const from = st + fr(s.counter.t);
        const end = st + frames - (s.counter.mode === "land" ? fr(0.6) : 2);
        const n = Math.max(1, Math.floor((end - from) / 3) + 1);
        for (let j = 0; j < n; j++) {
          const p = j / Math.max(1, n - 1);
          cues.push({ at: from + j * 3, s: FLAPS[FLAP_ORDER[j % FLAP_ORDER.length]], vol: 0.02 + 0.03 * p, name: `counter ${j + 1}` });
        }
      }
    }
    for (const x of s.sfx) {
      if (x.s in SOUNDS) cues.push({ at: st + fr(x.t), s: x.s as SoundName, vol: x.vol, name: `${label} (${x.s})` });
    }
  });
  return cues.filter((c) => c.at >= 0);
};

// ------------------------------------------------------------------ composition
export const Short: React.FC<ShortProps> = (props) => {
  const spec = shortSchema.parse(props);
  const { starts, total } = sceneStarts(spec.scenes);
  const cues = buildCues(spec, starts);
  const climaxAt = spec.scenes.findIndex((s) => s.climax);
  const dipFrom = climaxAt > 0 ? starts[climaxAt] - fr(0.5) : -1;
  const musicGain = (f: number) => {
    const fade = interpolate(f, [total - 18, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (dipFrom < 0) return fade;
    // music drops out for the half second before the climax and comes back on it
    const dip = interpolate(f, [dipFrom - 4, dipFrom, starts[climaxAt] - 1, starts[climaxAt]], [1, 0.15, 0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return fade * dip;
  };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {spec.voiceover ? <Audio src={src(spec.base, spec.voiceover)} volume={spec.voVolume} /> : null}
      {spec.music ? <Audio src={src(spec.base, spec.music)} volume={(f) => spec.musicVolume * musicGain(f)} /> : null}
      <SfxTrack cues={cues} volume={spec.sfxVolume} />
      {spec.scenes.map((s, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={fr(s.dur)} name={`${i + 1} · ${s.name || "scene"}`}>
          <SceneView s={s} spec={spec} frames={fr(s.dur)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Default spec shown in Studio: a MantAI-style 12 s example with placeholders only (no media needed). */
const shortDefaultsInput: ShortProps = {
  scenes: [
    {
      name: "Hook",
      dur: 3,
      words: [
        { t: 0.2, text: "your truck", font: "sansLight", size: 90, x: 50, y: 30 },
        { t: 0.7, text: "can't hear", font: "sans", size: 170, x: 50, y: 40 },
        { t: 1.4, text: "itself", font: "script", size: 380, x: 50, y: 55, color: "#e1251b" },
      ],
    },
    {
      name: "Number",
      dur: 3.5,
      words: [
        { t: 0.1, text: "one breakdown costs", font: "sansLight", size: 80, x: 50, y: 32 },
        { t: 2.2, text: "per day", font: "serifItalic", size: 130, x: 50, y: 64, color: "#0a8f50" },
      ],
      counter: { t: 0.5, to: 760, prefix: "$", y: 48 },
    },
    {
      name: "Payoff",
      dur: 4,
      climax: true,
      words: [
        { t: 0.1, text: "we listen", font: "sans", size: 170, x: 50, y: 38 },
        { t: 1.0, text: "4 weeks earlier", font: "serifItalic", size: 120, x: 50, y: 52, color: "#e1251b" },
        { t: 2.2, text: "@juansimon.builds", font: "sansLight", size: 64, x: 50, y: 80 },
      ],
    },
  ],
};

/** Fully populated defaults (every field present) so the Studio props editor can show all of them. */
export const shortDefaults: Spec = shortSchema.parse(shortDefaultsInput);
