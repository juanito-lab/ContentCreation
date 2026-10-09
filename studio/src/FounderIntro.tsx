// FounderIntro: MantAI version of the "I left my hometown… this is only the beginning" founder reel.
// 9 beats, ~22 s, 1080x1920. Every beat starts on a voiceover line; scene lengths live in DURS (seconds)
// and can be overridden from props (after recording your own voiceover: run tools/words.py and adjust).
//
//  1 Hook      "I left Zürich to chase a dream."            text stack + photo of Juan, red script "dream"
//  2 Map       "Moved to Berlin,"                            Zürich → Berlin arc drawing itself
//  3 CODE      "for CODE."                                   wordmark
//  4 Open day  "On open day, I talked to exactly one person." photo Juan + Santi
//  5 Grid      "Out of everyone there, he's now my co-founder." grey avatar grid, one lights up (Santi)
//  6 Building  "Together, we're building MantAI."            photo wall → MANTAI (climax: riser + drum)
//  7 Number    "One breakdown costs $760 a day."             counter + bar card
//  8 Product   "Our sensors hear it coming, up to 4 weeks early." waveform card + alert
//  9 Outro     "I'm Juan. This is only the beginning."       name, photo, squiggle arrow, script "beginning"
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { FONTS } from "./lib/fonts";
import { Words, WHITE_SHADOW } from "./lib/words";
import type { Word } from "./lib/words";
import { SfxTrack } from "./lib/sfx";
import type { Cue, SoundName } from "./lib/sfx";

const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const RED = "#E10600";
const GREEN = "#12b76a";
const INK = "#0b0b0c";

/** Default beat lengths in seconds (fit the guide voiceover). */
export const DURS = [2.2, 1.4, 1.0, 3.2, 2.8, 2.4, 2.6, 3.2, 3.2];

const fileOrEmpty = z.string().default("");
export const founderSchema = z.object({
  /** voiceover under public/ ("" = none). vo/guide.wav = robotic timing guide; replace with your recording */
  voiceover: fileOrEmpty,
  voVolume: z.number().min(0).max(1).default(1),
  music: fileOrEmpty,
  musicVolume: z.number().min(0).max(1).default(0.12),
  sfxVolume: z.number().min(0).max(2).default(1.3),
  /** seconds per beat (9 values) */
  durs: z.array(z.number().positive()).length(9).default(DURS),
  /** photos/clips under public/ ("" = grey placeholder with a label telling you what to shoot) */
  juan1: fileOrEmpty,
  duo: fileOrEmpty,
  santi: fileOrEmpty,
  juan2: fileOrEmpty,
  /** 12–24 photos for the "building" wall: dorm, device, soldering, Stanford, pilots, trucks… */
  wall: z.array(z.string()).default([]),
  /** number shown in beat 7 */
  costPerDay: z.number().default(760),
  /** alert text in beat 8 */
  alertPart: z.string().default("Brake pad · rear left"),
  alertLead: z.string().default("~4 weeks before failure"),
});
export type FounderProps = z.input<typeof founderSchema>;
export type P = z.output<typeof founderSchema>;

const starts = (d: number[]) => d.reduce<number[]>((a, x, i) => [...a, i === 0 ? 0 : a[i - 1] + fr(d[i - 1])], []);
export const calculateFounderMetadata: CalculateMetadataFunction<FounderProps> = ({ props }) => {
  const p = founderSchema.parse(props);
  return { durationInFrames: p.durs.reduce((a, d) => a + fr(d), 0), props: p };
};

// ------------------------------------------------------------------ building blocks
const isImg = (f: string) => /\.(png|jpe?g|webp|gif)$/i.test(f);
export const Media: React.FC<{ file: string; label: string; hue?: number; start?: number }> = ({ file, label, hue = 210, start = 0 }) =>
  file ? (
    isImg(file) ? (
      <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <OffthreadVideo src={staticFile(file)} muted trimBefore={fr(start)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    )
  ) : (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 14% 88%), hsl(${hue} 16% 74%))`,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "rgba(0,0,0,0.42)",
        fontSize: 34,
        letterSpacing: "0.12em",
        lineHeight: 1.4,
        whiteSpace: "pre-line",
        padding: 30,
        textTransform: "uppercase",
        ...FONTS.sansLight,
      }}
    >
      {label}
    </AbsoluteFill>
  );

const usePop = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - delay;
  const s = spring({ frame: Math.max(0, t), fps, config: { damping, stiffness: 160 } });
  return { t, s, visible: t >= 0, opacity: interpolate(t, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
};

/** Rounded photo card. left/top/width in % of frame, aspect = w/h. */
/** Ambient light behind cards (from Jasper's kit, lib/ambient.tsx): the same media again, scaled up, heavily blurred,
 *  brightened and saturated, so the photo/clip glows onto the white background like YouTube's ambient mode. Only on light
 *  backgrounds. glow = 0 turns it off (e.g. for many small tiles), 1 = full. */
export const AMBIENT = { scale: 1.07, blur: 58, brightness: 1.3, saturate: 1.8, opacity: 0.85 };
export const Card: React.FC<{ file: string; label: string; left: number; top: number; width: number; aspect: number; delay?: number; zoom?: number; hue?: number; rotate?: number; radius?: number; glow?: number }> = ({
  file,
  label,
  left,
  top,
  width,
  aspect,
  delay = 0,
  zoom = 1.08,
  hue,
  rotate = 0,
  radius = 26,
  glow = 1,
}) => {
  const frame = useCurrentFrame();
  const { s, visible } = usePop(delay);
  const opacity = 1;
  if (!visible) return null;
  const z = interpolate(frame - delay, [0, 90], [1, zoom], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        aspectRatio: `${aspect}`,
        transform: `scale(${interpolate(s, [0, 1], [0.9, 1])}) rotate(${rotate}deg)`,
        opacity,
      }}
    >
      {glow > 0 && file ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${AMBIENT.scale})`,
            filter: `blur(${AMBIENT.blur * Math.max(0.5, glow)}px) brightness(${AMBIENT.brightness}) saturate(${AMBIENT.saturate})`,
            opacity: AMBIENT.opacity * glow,
            borderRadius: radius,
            overflow: "hidden",
          }}
        >
          <Media file={file} label={label} hue={hue} />
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", boxShadow: "0 8px 22px rgba(0,0,0,0.10)", background: "#dfe3ea" }}>
        <AbsoluteFill style={{ transform: `scale(${z})` }}>
          <Media file={file} label={label} hue={hue} />
        </AbsoluteFill>
      </div>
    </div>
  );
};

type W = Omit<Word, "at"> & { t: number };
export const words = (ws: W[]): Word[] => ws.map(({ t, ...w }) => ({ ...w, at: Math.max(0, fr(t - 0.1)) }));

/** Bold caption at the bottom, like the reference's subtitle lines. */
export const Sub: React.FC<{ text: string; at: number; until?: number }> = ({ text, at, until }) => {
  const frame = useCurrentFrame();
  if (frame < fr(at) || (until !== undefined && frame >= fr(until))) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "68%", textAlign: "center", fontSize: 72, color: "#000", ...FONTS.sans, textShadow: "0 0 18px #fff, 0 0 6px #fff" }}>{text}</div>
  );
};

/** Hand-drawn underline: two strokes that draw themselves (strokeDashoffset) over ~8 frames starting at `at` (frames in the
 *  enclosing Sequence). x1/x2/y in px on the 1080x1920 canvas. */
export const Swoosh: React.FC<{ at: number; x1: number; x2: number; y: number; color?: string; width?: number; dur?: number; shadow?: boolean }> = ({ at, x1, x2, y, color = RED, width = 15, shadow = false }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const w = x2 - x1;
  // v7: static, fully drawn on the frame it appears
  const pen = { fill: "none", stroke: color, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: shadow ? "drop-shadow(0 3px 8px rgba(0,0,0,0.5))" : undefined }}>
      <path d={`M ${x1} ${y + 6} C ${x1 + w * 0.3} ${y - 16}, ${x1 + w * 0.65} ${y + 14}, ${x2} ${y - 10}`} {...pen} strokeWidth={width} />
      <path d={`M ${x1 + w * 0.14} ${y + 34} C ${x1 + w * 0.4} ${y + 16}, ${x1 + w * 0.68} ${y + 38}, ${x2 - w * 0.1} ${y + 20}`} {...pen} strokeWidth={width * 0.62} />
    </svg>
  );
};

// ------------------------------------------------------------------ beats
const B1: React.FC<{ p: P }> = ({ p }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Card file={p.juan1} label={"photo: you, outside,\nfull body, wide"} left={7} top={46} width={86} aspect={16 / 10} delay={0} zoom={1.12} />
    <Words
      color={INK}
      words={words([
        { t: 0.1, text: "I left", font: "sansLight", size: 92, x: 26, y: 12 },
        { t: 0.35, text: "Zürich", font: "sans", size: 210, x: 46, y: 20 },
        { t: 0.75, text: "to chase my", font: "sansLight", size: 86, x: 33, y: 28 },
        { t: 1.3, text: "dream", font: "script", size: 360, x: 50, y: 41, color: RED, weight: 700 },
      ])}
    />
  </AbsoluteFill>
);

/** Zürich → Berlin: dotted backdrop, two pins, an arc that draws itself with an arrow head. */
const ZX = 300,
  ZY = 1290,
  BX = 790,
  BY = 640;
const ARC = `M ${ZX} ${ZY} C ${ZX + 40} ${ZY - 380} ${BX - 260} ${BY - 120} ${BX} ${BY}`;
const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [5, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const head = interpolate(frame, [26, 29], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pin = (x: number, y: number, at: number, label: string, dx: number, dy: number) => {
    const s = spring({ frame: Math.max(0, frame - at), fps: FPS, config: { damping: 11, stiffness: 180 } });
    if (frame < at) return null;
    return (
      <g key={label}>
        <circle cx={x} cy={y} r={22 * s} fill="#fff" stroke={INK} strokeWidth={8} />
        <circle cx={x} cy={y} r={7 * s} fill={INK} />
        <text x={x + dx} y={y + dy} fontSize={96} textAnchor="middle" style={{ ...FONTS.sans, fill: INK } as React.CSSProperties} opacity={s}>
          {label}
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#f4f5f7" }}>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 30 * 17 }, (_, i) => {
          const x = (i % 17) * 66 + 12;
          const y = Math.floor(i / 17) * 66 + 20;
          return <circle key={i} cx={x} cy={y} r={3} fill="#d5d8de" />;
        })}
        <path d={ARC} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
        {head > 0 ? (
          <g opacity={head}>
            <path d={`M ${BX} ${BY} L ${BX - 62} ${BY - 12} M ${BX} ${BY} L ${BX - 32} ${BY + 50}`} stroke={INK} strokeWidth={10} strokeLinecap="round" fill="none" />
          </g>
        ) : null}
        {pin(ZX, ZY, 0, "Zürich", 0, 130)}
        {pin(BX, BY, 24, "Berlin", 0, -60)}
      </svg>
    </AbsoluteFill>
  );
};

const B3: React.FC = () => {
  const { s, opacity } = usePop(0, 12);
  return (
    <AbsoluteFill style={{ background: "#fff", justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`, opacity, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ fontSize: 230, color: INK, ...FONTS.sans, letterSpacing: "-0.02em" }}>CODE</div>
        <div style={{ fontSize: 34, color: INK, lineHeight: 1.15, ...FONTS.sansLight, letterSpacing: "0.04em" }}>
          UNIVERSITY
          <br />
          OF APPLIED
          <br />
          SCIENCES
        </div>
      </div>
    </AbsoluteFill>
  );
};

const B4: React.FC<{ p: P }> = ({ p }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Words
      color={INK}
      words={words([
        { t: 0.1, text: "on open day", font: "sansLight", size: 84, x: 50, y: 11 },
        { t: 0.75, text: "I talked to", font: "sansLight", size: 84, x: 50, y: 17 },
        { t: 1.6, text: "one person", font: "sans", size: 168, x: 50, y: 25 },
      ])}
    />
    <Card file={p.duo} label={"photo: you + Santi\nside by side"} left={16} top={34} width={68} aspect={4 / 5} delay={fr(1.6)} zoom={1.06} hue={30} />
  </AbsoluteFill>
);

/** Grey avatar grid; one cell (Santi) lights up with a ring and sparkles. */
const COLS = 8,
  ROWS = 13,
  CELL = 1080 / COLS;
const HL = { c: 3, r: 6 };
const Avatar: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={o * 0.9}>
      <circle cx={x} cy={y} r={48} fill="#e6e7ea" />
      <circle cx={x} cy={y - 12} r={17} fill="#b9bcc3" />
      <path d={`M ${x - 30} ${y + 34} Q ${x} ${y - 6} ${x + 30} ${y + 34}`} fill="#b9bcc3" />
    </g>
  );
};
export const B5: React.FC<{ p: P; hl?: number }> = ({ p, hl = 1.35 }) => {
  const frame = useCurrentFrame();
  const hlAt = fr(hl);
  const s = spring({ frame: Math.max(0, frame - hlAt), fps: FPS, config: { damping: 10, stiffness: 150 } });
  const hx = HL.c * CELL + CELL / 2,
    hy = HL.r * CELL + 140;
  const dim = interpolate(frame, [hlAt, hlAt + 8], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: dim }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS,
            r = Math.floor(i / COLS);
          return <Avatar key={i} x={c * CELL + CELL / 2} y={r * CELL + 140} delay={Math.floor(r * 0.8 + c * 0.4)} />;
        })}
      </svg>
      {frame >= hlAt ? (
        <>
          <div style={{ position: "absolute", left: hx - 190, top: hy - 190, width: 380, height: 380, borderRadius: "50%", overflow: "hidden", filter: `blur(${AMBIENT.blur}px) brightness(${AMBIENT.brightness}) saturate(${AMBIENT.saturate})`, opacity: AMBIENT.opacity * s }}>
            <Media file={p.santi} label="" hue={120} />
          </div>
          <div
            style={{
              position: "absolute",
              left: hx - 150,
              top: hy - 150,
              width: 300,
              height: 300,
              borderRadius: "50%",
              overflow: "hidden",
              border: "10px solid #fff",
              boxShadow: "0 0 0 4px #e5e5e5, 0 18px 40px rgba(0,0,0,0.25)",
              transform: `scale(${s})`,
            }}
          >
            <Media file={p.santi} label={"Santi\nheadshot"} hue={120} />
          </div>
          {[
            [-190, -150, 54],
            [175, -120, 40],
            [160, 165, 46],
          ].map(([dx, dy, sz], i) => (
            <div key={i} style={{ position: "absolute", left: hx + dx, top: hy + dy, fontSize: sz, color: INK, transform: `scale(${s}) rotate(${frame * 2}deg)` }}>
              ✦
            </div>
          ))}
        </>
      ) : null}
      <Words
        color={INK}
        words={words([
          { t: hl - 0.1, text: "now my", font: "elegant", size: 112, x: 25, y: 10.5 },
          { t: hl + 0.2, text: "co-founder", font: "script", size: 232, x: 50, y: 19.5, weight: 700, color: RED },
        ])}
      />
      <Sub text="out of everyone there" at={0} until={hl} />
    </AbsoluteFill>
  );
};

/** Photo wall: tiles land one after another, then MANTAI on top (climax). */
const TILES = [
  [4, 22, 40, 0.75, -3],
  [48, 21, 26, 1.0, 2],
  [76, 23, 21, 0.8, -2],
  [6, 34, 24, 1.1, 2],
  [33, 33, 34, 0.7, -1],
  [70, 32, 26, 1.0, 3],
  [3, 46, 30, 0.8, -2],
  [36, 45, 22, 1.2, 1],
  [61, 44, 35, 0.75, -3],
  [5, 57, 22, 1.0, 2],
  [30, 56, 38, 0.72, -1],
  [70, 57, 26, 1.0, 2],
  [8, 68, 34, 0.8, -2],
  [45, 67, 24, 1.1, 3],
  [71, 69, 26, 0.85, -2],
  [20, 78, 30, 0.9, 1],
  [53, 78, 34, 0.8, -1],
] as const;
const WALL_LABELS = ["dorm", "first MSU", "soldering", "Stanford", "pilot truck", "dashboard", "whiteboard", "3D print", "late night", "Santi coding", "install", "airport", "demo day", "sensor close-up", "team dinner", "road test", "pitch"];
const WALL_STEP = 2;
export const B6: React.FC<{ p: P; brand?: number; swoosh?: boolean; bg?: string; tile0?: number }> = ({ p, brand = 1.05, swoosh = false, bg = "#fff", tile0 = 6 }) => {
  const frame = useCurrentFrame();
  const brandAt = fr(brand);
  // camera shake on the climax drum frame: decays over ~10 frames
  const sk = frame >= brandAt ? Math.max(0, 1 - (frame - brandAt) / 10) : 0;
  const shake = `translate(${Math.sin(frame * 3.3) * 16 * sk}px, ${Math.cos(frame * 4.1) * 12 * sk}px) rotate(${Math.sin(frame * 2.7) * 0.9 * sk}deg) scale(${1 + 0.025 * sk})`;
  const veil = interpolate(frame, [brandAt - 2, brandAt + 6], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ transform: shake }}>
      {TILES.map(([l, t, w, a, r], i) => (
        <Card key={i} file={p.wall[i] ?? ""} label={WALL_LABELS[i % WALL_LABELS.length]} left={l} top={t} width={w} aspect={1 / a} delay={tile0 + i * WALL_STEP} zoom={1} hue={(i * 47) % 360} rotate={r} radius={14} glow={0.45} />
      ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${veil})` }} />
      {/* v7: text lives outside the shaking layer, pixel-still */}
      <Words
        color={INK}
        // v16: white halo (same recipe as NameTag's "Santiago") — before the climax veil ramps in, this text sits directly
        // on the raw, unblurred photo tiles (some dark, some busy/high-contrast) with nothing behind it; the halo keeps
        // both "together" and "we're building" readable no matter which tile happens to be underneath at a given frame.
        shadow="0 0 18px #fff, 0 0 8px #fff, 0 0 3px #fff"
        words={words([
          // v14: +7.1 (was 10.5/15.5) — "together" top edge sat well above the 220px safe line (Juan's reference).
          { t: 0.05, text: "together", font: "script", size: 185, x: 29, y: 17.6, weight: 700, color: RED },
          { t: 0.45, text: "we're building", font: "elegant", size: 100, x: 71, y: 22.6 },
        ])}
      />
      {frame >= brandAt ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: "12%",
            top: "44%",
            textAlign: "center",
            fontSize: 215,
            color: INK,
            ...FONTS.sans,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            transform: "translateY(-50%)",
            textShadow: "0 0 40px #fff",
          }}
        >
          MANT<span style={{ color: RED }}>AI</span>
        </div>
      ) : null}
      {swoosh ? <Swoosh at={brandAt} x1={150} x2={880} y={1000} /> : null}
    </AbsoluteFill>
  );
};

const B7: React.FC<{ p: P }> = ({ p }) => {
  const frame = useCurrentFrame();
  const at = fr(0.9);
  const span = fr(2.6) - at - 10;
  const prog = Math.min(1, Math.max(0, (frame - at) / span));
  const val = Math.round(p.costPerDay * (1 - Math.pow(1 - prog, 3)));
  const cs = spring({ frame: Math.max(0, frame - at), fps: FPS, config: { damping: 12, stiffness: 170 } });
  const bars = [0.22, 0.3, 0.27, 0.42, 0.5, 0.63, 0.78, 1];
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Words
        color={INK}
        words={words([
          { t: 0.05, text: "one breakdown", font: "sans", size: 132, x: 50, y: 13 },
          { t: 0.5, text: "costs", font: "sansLight", size: 90, x: 50, y: 21 },
          { t: 2.0, text: "per day", font: "serifItalic", size: 120, x: 50, y: 40, color: RED },
        ])}
      />
      {frame >= at ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "31%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            transform: `translateY(-50%) scale(${interpolate(cs, [0, 1], [0.8, 1])})`,
            color: RED,
            fontSize: 230,
            ...FONTS.sans,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${val.toLocaleString("en-US")}
          <span style={{ fontSize: 110 }}>▲</span>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: "9%", width: "82%", top: "50%", height: "26%", background: "#fff", borderRadius: 30, boxShadow: "0 10px 40px rgba(0,0,0,0.10)", padding: 40, boxSizing: "border-box", opacity: interpolate(frame, [fr(1.0), fr(1.2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 40, color: INK, ...FONTS.sans }}>Downtime cost · per truck</div>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 40, height: "62%", display: "flex", alignItems: "flex-end", gap: 18 }}>
          {bars.map((b, i) => {
            const g = interpolate(frame, [fr(1.1) + i * 3, fr(1.1) + i * 3 + 10], [0, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
            return <div key={i} style={{ flex: 1, height: `${g * 100}%`, background: i === bars.length - 1 ? GREEN : "#bfe8d3", borderRadius: 8 }} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Waveform from the MSU; an anomaly band turns red and an alert pops. */
export const B8: React.FC<{ p: P }> = ({ p }) => {
  const frame = useCurrentFrame();
  const alertAt = fr(1.3);
  const N = 64;
  const as = spring({ frame: Math.max(0, frame - alertAt), fps: FPS, config: { damping: 11, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ background: "#f4f5f7" }}>
      <Words
        color={INK}
        words={words([
          { t: 0.05, text: "our sensors", font: "sansLight", size: 90, x: 50, y: 11 },
          { t: 0.45, text: "hear it coming", font: "sans", size: 150, x: 50, y: 18.5 },
        ])}
      />
      <div style={{ position: "absolute", left: "7%", width: "86%", top: "28%", height: "34%", background: "#fff", borderRadius: 34, boxShadow: "0 12px 40px rgba(0,0,0,0.10)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 40, top: 34, fontSize: 34, color: INK, opacity: 0.6, letterSpacing: "0.12em", ...FONTS.sansLight }}>MSU · TRUCK 07 · ACOUSTIC</div>
        <div style={{ position: "absolute", right: 40, top: 30, width: 18, height: 18, borderRadius: 9, marginTop: 10, background: frame >= alertAt ? RED : GREEN }} />
        <div style={{ position: "absolute", left: 40, right: 40, top: 110, bottom: 50, display: "flex", alignItems: "center", gap: 6 }}>
          {Array.from({ length: N }, (_, i) => {
            const anomaly = i > 38 && i < 50;
            const base = 0.18 + 0.14 * Math.abs(Math.sin(i * 0.9 + frame * 0.35)) + 0.08 * Math.abs(Math.sin(i * 2.3 - frame * 0.21));
            const boost = anomaly ? interpolate(frame, [alertAt - 10, alertAt], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7 + frame * 0.5))) : 0;
            return <div key={i} style={{ flex: 1, height: `${Math.min(1, base + boost) * 100}%`, borderRadius: 6, background: anomaly && frame >= alertAt - 6 ? RED : "#1f2937" }} />;
          })}
        </div>
      </div>
      {frame >= alertAt ? (
        <div
          style={{
            position: "absolute",
            left: "7%",
            width: "86%",
            top: "65%",
            background: INK,
            color: "#fff",
            borderRadius: 30,
            padding: "34px 40px",
            boxSizing: "border-box",
            transform: `scale(${interpolate(as, [0, 1], [0.85, 1])})`,
            opacity: interpolate(frame - alertAt, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
            boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: 34, color: "#fff", letterSpacing: "0.1em", ...FONTS.sansLight }}>⚠ WEAR DETECTED</div>
          <div style={{ fontSize: 60, marginTop: 10, ...FONTS.sans, letterSpacing: "-0.03em" }}>{p.alertPart}</div>
          <div style={{ fontSize: 46, marginTop: 6, color: "#fff", ...FONTS.serifItalic }}>{p.alertLead}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Outro: I'm Juan, photo, hand-drawn squiggle from the name into the photo, "this is only the beginning". */
const SX = 905,
  SY = 0.155 * 1920 + 40,
  EX = 760,
  EY = 0.27 * 1920 + 150;
const SQ = `M ${SX} ${SY} C ${SX + 80} ${SY + 10} ${SX + 110} ${SY + 70} ${SX + 70} ${SY + 115} C ${SX + 40} ${SY + 150} ${SX - 20} ${SY + 130} ${SX - 5} ${SY + 95} C ${SX + 10} ${SY + 60} ${SX + 80} ${SY + 90} ${SX + 60} ${SY + 150} C ${SX + 40} ${SY + 210} ${EX + 120} ${EY} ${EX} ${EY}`;
export const B9: React.FC<{ p: P; frames: number; line2?: number; last?: number; bg?: string; noFade?: boolean; card?: React.ReactNode }> = ({ p, frames, line2 = 0.95, last = 1.5, bg = "#fff", noFade = false, card }) => {
  const frame = useCurrentFrame();
  const drawAt = fr(0.45);
  const line = frame >= drawAt ? 1 : 0; // v7: static, fully drawn when it appears
  const head = line;
  const fade = noFade ? 1 : interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pen = { fill: "none", stroke: RED, strokeWidth: 9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1 };
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ opacity: fade }}>
        {card ?? <Card file={p.juan2} label={"photo: you, landscape,\narms open"} left={8} top={27} width={76} aspect={16 / 10} delay={0} zoom={1.1} />}
        <Words
          color={INK}
          words={words([
            // v16: moved closer to "Juan" both ways (was x:12/y:15.6) — Juan flagged the two reading as disconnected;
            // still clear of the 220px top safe line (top edge ~298px).
            { t: 0.05, text: "I'm", font: "elegant", size: 130, x: 20, y: 18.9 },
            { t: 0.05, text: "Juan", font: "sans", size: 270, x: 52, y: 23.6 },
            { t: line2, text: "this is only the", font: "sansLight", size: 96, x: 40, y: 59 },
            { t: last, text: "beginning", font: "script", size: 222, x: 42, y: 66.5, weight: 700, color: RED },
          ])}
        />
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          {frame >= drawAt ? <path d={SQ} {...pen} strokeDashoffset={1 - line} /> : null}
          {head > 0 ? [`M ${EX} ${EY} L ${EX + 36} ${EY - 22}`, `M ${EX} ${EY} L ${EX + 32} ${EY + 26}`].map((d) => <path key={d} d={d} {...pen} strokeDashoffset={1 - head} />) : null}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ sound design
const cuesFor = (S: number[]): Cue[] => {
  const c: Cue[] = [];
  const at = (i: number, sec: number) => S[i] + fr(sec);
  const k = (i: number, sec: number, n: number, name: string) => c.push({ at: at(i, sec - 0.1), s: (["key1", "key2", "key3"] as SoundName[])[n % 3], vol: 0.07, name });
  // 1 hook
  c.push({ at: at(0, 0), s: "shutterSlr3", vol: 0.085, name: "hook photo (shutter)" });
  k(0, 0.1, 0, "I left");
  k(0, 0.35, 1, "Zürich");
  k(0, 0.75, 2, "to chase my");
  c.push({ at: at(0, 1.2), s: "pencil1", vol: 0.045, name: "dream (pencil)" });
  // 2 map
  c.push({ at: at(1, 0), s: "page1", vol: 0.1, name: "map (page)" });
  c.push({ at: at(1, 0.17), s: "pencil2", vol: 0.04, name: "arc draws (pencil)" });
  c.push({ at: at(1, 0.8), s: "cardPlace1", vol: 0.07, name: "Berlin pin" });
  // 3 CODE
  c.push({ at: at(2, 0), s: "flapBurst3", vol: 0.04, name: "CODE (flaps)" });
  // 4 open day
  c.push({ at: at(3, 0), s: "page2", vol: 0.08, name: "open day (page)" });
  k(3, 0.1, 0, "on open day");
  k(3, 0.75, 1, "I talked to");
  c.push({ at: at(3, 1.6), s: "shutterInsta2", vol: 0.085, name: "duo photo (shutter)" });
  // 5 grid
  c.push({ at: at(4, 0), s: "riffle1", vol: 0.08, name: "grid (riffle)" });
  c.push({ at: at(4, 1.35), s: "shutterDslr", vol: 0.12, name: "Santi highlight (shutter)" });
  c.push({ at: at(4, 1.45), s: "pencil1", vol: 0.045, name: "co-founder (pencil)" });
  // 6 wall + climax
  for (let i = 0; i < TILES.length; i++) c.push({ at: S[5] + 6 + i * WALL_STEP, s: (["shutter3", "shutterInsta1", "shutterDslr"] as SoundName[])[i % 3], vol: 0.03 + 0.002 * i, name: `wall ${i + 1}` });
  c.push({ at: S[5] - fr(0.64), s: "riser1", vol: 0.05, name: "riser into wall" });
  c.push({ at: at(5, 1.05), s: "tom1", vol: 0.14, name: "MANTAI (drum)" });
  // 7 number
  c.push({ at: at(6, 0), s: "page1", vol: 0.1, name: "number (page)" });
  for (let i = 0; i < 12; i++) c.push({ at: at(6, 0.9) + i * 3, s: (["flapLo", "flap", "flapHi"] as SoundName[])[[1, 0, 2, 0, 1, 2][i % 6]], vol: 0.02 + 0.025 * (i / 11), name: `counter ${i + 1}` });
  c.push({ at: at(6, 2.0), s: "pencil2", vol: 0.035, name: "per day (pencil)" });
  // 8 product
  c.push({ at: at(7, 0), s: "switch2", vol: 0.08, name: "sensor on (switch)" });
  c.push({ at: at(7, 1.3), s: "clink1", vol: 0.05, name: "alert (clink)" });
  // 9 outro
  c.push({ at: at(8, 0), s: "tom1", vol: 0.09, name: "outro (drum)" });
  c.push({ at: at(8, 0), s: "shutterInsta2", vol: 0.08, name: "outro photo (shutter)" });
  c.push({ at: at(8, 0.45), s: "pencil1", vol: 0.045, name: "squiggle (pencil)" });
  k(8, 0.95, 2, "this is only the");
  c.push({ at: at(8, 1.45), s: "pencil2", vol: 0.04, name: "beginning (pencil)" });
  return c;
};

// ------------------------------------------------------------------ composition
export const FounderIntro: React.FC<FounderProps> = (props) => {
  const p = founderSchema.parse(props);
  const S = starts(p.durs);
  const total = S[8] + fr(p.durs[8]);
  const beats: React.ReactNode[] = [
    <B1 p={p} />,
    <B2 />,
    <B3 />,
    <B4 p={p} />,
    <B5 p={p} />,
    <B6 p={p} />,
    <B7 p={p} />,
    <B8 p={p} />,
    <B9 p={p} frames={fr(p.durs[8])} />,
  ];
  const names = ["1 Hook", "2 Map", "3 CODE", "4 Open day", "5 Grid", "6 Building (climax)", "7 Number", "8 Product", "9 Outro"];
  const climax = S[5];
  const musicGain = (f: number) =>
    interpolate(f, [climax - 18, climax - 12, climax - 1, climax], [1, 0.12, 0.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(f, [total - 20, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {p.voiceover ? <Audio src={staticFile(p.voiceover)} volume={p.voVolume} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={(f) => p.musicVolume * musicGain(f)} /> : null}
      <SfxTrack cues={cuesFor(S)} volume={p.sfxVolume} />
      {beats.map((b, i) => (
        <Sequence key={i} from={S[i]} durationInFrames={fr(p.durs[i])} name={names[i]}>
          {b}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const founderDefaults: P = founderSchema.parse({ voiceover: "vo/guide.wav" });
// keep WHITE_SHADOW import used for future full-bleed variants
void WHITE_SHADOW;
