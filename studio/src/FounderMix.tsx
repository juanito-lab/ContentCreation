// FounderMix: Jasper's graphic beats (map, avatar grid, photo wall, alert card, squiggle outro) mixed with
// Santi's style (real full-bleed footage, centred subtitles, mixed-font text stacks, "follow along" close).
// Real media from Juan's Downloads lives in public/mix/. ~32 s.
//
//  1 Hook      full-bleed Zürich sunset    "I left Zürich to chase my dream."
//  2 Map       Zürich → Berlin → SF        "Zürich. Berlin. Next:"
//  3 SF        full-bleed SF skyline        "…San Francisco."
//  4 Open day  card: Juan + Santi           "At CODE's open day, I talked to exactly one person."
//  5 Grid      avatar grid → Santi          "Out of everyone there, he's now my co-founder."
//  6 Dorm      full-bleed laptop nights     "Same dorm. Late nights. Pivot after pivot."
//  7 Stanford  full-bleed plane window      "Then Stanford changed everything."
//  8 Build     device → mount → pilot car   "Two weeks later: our first device. Our first pilot."
//  9 MantAI    real photo wall → MANTAI     "Together, we're building MantAI."   (climax)
// 10 Tech      waveform + alert             "Next-gen tech that predicts vehicle issues up to four weeks in advance."
// 11 Works     device on the dash, ✓        "And it works."
// 12 Outro     Juan with mic, squiggle      "I'm Juan. This is only the beginning."
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { FONTS } from "./lib/fonts";
import { Words, WHITE_SHADOW } from "./lib/words";
import { CITY, COUNTRIES } from "./lib/worldmap";
import { SfxTrack } from "./lib/sfx";
import type { Cue, SoundName } from "./lib/sfx";
import { B5, B6, B9, Card, Media, Swoosh, founderSchema, words } from "./FounderIntro";

const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const RED = "#e1251b";
const GREEN = "#12b76a";
const INK = "#0b0b0c";

/** Beat lengths fitted to Juan's take 5 (18-41-31): cleaned, levelled, +8% tempo, tight pauses, 't-t-two' stutter → vo/juan-t5-fast.wav. */
export const MIX_DURS = [2.45, 3.17, 1.34, 4.33, 3.13, 4.2, 2.73, 4.99, 2.27, 4.37, 1.62, 3.11];
/** In-beat cue times (s) from take 1's phrase starts. */
const T = { hook: [0.21, 0.62, 1.09, 1.69], mapBerlin: 1.48, mapNext: 2.39, open: [0.13, 1.38, 3.1], hl: 1.42, dorm: [0.02, 1.19, 2.42], stan: [0.03, 0.89, 1.39], build: { later: 1.06, device: 1.95, mount: 2.75, pilot: 3.53 }, brand: 1.49, tech: [0.04, 1.33, 2.46, 2.69, 3.34], outro: [1.13, 1.91, 2.56] };
const NAMES = ["1 Hook", "2 Map", "3 SF", "4 Open day", "5 Grid", "6 Dorm", "7 Stanford", "8 Build", "9 MantAI (climax)", "10 Tech", "11 It works", "12 Outro"];

export const mixSchema = z.object({
  voiceover: z.string().default("vo/juan-t5-fast.wav"),
  /** 0.6 ≈ −4.4 dB: voice sits inside the music instead of on top of it */
  voVolume: z.number().min(0).max(1).default(0.45),
  /** original synthesized bed (music/compose.py), synced to the cuts; "" = no music (add a sound in-app instead) */
  music: z.string().default("music/mantai-bed.wav"),
  musicVolume: z.number().min(0).max(1).default(0.3),
  sfxVolume: z.number().min(0).max(2).default(1.5),
  durs: z.array(z.number().positive()).length(12).default(MIX_DURS),
  /** preview only: show where TikTok / Reels UI covers the frame */
  safeZones: z.boolean().default(false),
});
export type MixProps = z.input<typeof mixSchema>;
type MP = z.output<typeof mixSchema>;

const starts = (d: number[]) => d.reduce<number[]>((a, _x, i) => [...a, i === 0 ? 0 : a[i - 1] + fr(d[i - 1])], []);
export const calculateMixMetadata: CalculateMetadataFunction<MixProps> = ({ props }) => {
  const p = mixSchema.parse(props);
  return { durationInFrames: p.durs.reduce((a, d) => a + fr(d), 0), props: p };
};

const M = (f: string) => `mix/${f}`;
const WALL = ["w1.jpg", "w2.jpg", "w3.jpg", "w4.jpg", "w5.jpg", "w6.jpg", "w7.jpg", "w8.jpg", "w9.jpg", "w13.jpg", "w14.jpg", "w15.jpg", "w16.jpg", "w17.jpg", "pilot.jpg", "device.jpg", "duo.jpg"].map(M);
/** Reuse FounderIntro beats with Juan's real media. */
const P = founderSchema.parse({ duo: M("duo.jpg"), santi: M("santi_face2.jpg"), juan2: M("outro.mp4"), wall: WALL });

// ------------------------------------------------------------------ helpers
/** Full-bleed clip/photo with slow push-in and a soft top/bottom gradient for legibility. */
const Full: React.FC<{ file: string; zoom?: number; frames: number; start?: number; dim?: number; punch?: boolean }> = ({ file, zoom = 1.08, frames, start = 0, dim = 0.35, punch = false }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, frames], [1, zoom], { extrapolateRight: "clamp" });
  // cut transition: zoom-punch (scale 1.18 → 1 with a touch of blur) + white flash over the first 4 frames
  const k = punch ? 1 - Easing.out(Easing.cubic)(Math.min(1, frame / 6)) : 0;
  const flash = punch ? Math.max(0, 1 - frame / 4) * 0.6 : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z * (1 + 0.18 * k)})`, filter: k > 0.02 ? `blur(${6 * k}px)` : undefined }}>
        <Media file={file} label="" start={start} />
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})` }} /> : null}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${dim}) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,${dim}) 100%)` }} />
    </AbsoluteFill>
  );
};

/** Santi-style centred subtitle: bold white, one phrase at a time. */
type CapItem = { t: number; text: string; font?: keyof typeof FONTS; size?: number; color?: string; shadow?: string };
const Cap: React.FC<{ items: CapItem[]; y?: number; size?: number }> = ({ items, y = 38, size = 96 }) => {
  const frame = useCurrentFrame();
  const cur = [...items].reverse().find((i) => frame >= fr(i.t - 0.05));
  if (!cur) return null;
  const local = frame - fr(cur.t - 0.05);
  const s = spring({ frame: local, fps: FPS, config: { damping: 14, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: "10%",
        right: "16%",
        top: `${y}%`,
        transform: `translateY(-50%) scale(${interpolate(s, [0, 1], [0.8, 1])}) rotate(${interpolate(s, [0, 1], [-5, 0])}deg)`,
        textAlign: "center",
        color: cur.color ?? "#fff",
        fontSize: cur.size ?? size,
        lineHeight: 1.05,
        textShadow: cur.shadow ?? WHITE_SHADOW,
        letterSpacing: "-0.03em",
        ...FONTS[cur.font ?? "sans"],
      }}
    >
      {cur.text}
    </div>
  );
};

// ------------------------------------------------------------------ beats
/** Hook: Zürich sunset, then a hard cut to the motorbike on the lake road at "to chase my" (each clip in its own Sequence). */
const Hook: React.FC<{ frames: number }> = ({ frames }) => {
  const cut = fr(T.hook[2]);
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={cut} layout="none" name="hook.mp4">
        <Full file={M("hook.mp4")} frames={frames} zoom={1.1} dim={0.45} />
      </Sequence>
      <Sequence from={cut} durationInFrames={Math.max(1, frames - cut)} layout="none" name="moto.mp4">
        <Full file={M("moto.mp4")} frames={frames - cut} zoom={1.1} dim={0.45} punch />
      </Sequence>
      <Words
        color="#fff"
        shadow={WHITE_SHADOW}
        words={words([
          { t: T.hook[0], text: "I left", font: "sansLight", size: 108, x: 26, y: 12 },
          { t: T.hook[1], text: "Zürich", font: "sans", size: 270, x: 46, y: 21.5 },
          { t: T.hook[2], text: "to chase my", font: "elegant", size: 130, x: 34, y: 31 },
          { t: T.hook[3], text: "dream", font: "script", size: 350, x: 41, y: 46, color: RED, weight: 700 },
        ])}
      />
    </AbsoluteFill>
  );
};

/** Zürich → Berlin → San Francisco on a real (Natural Earth) world map with a flying plane. */
type V2 = readonly [number, number];
const ZRH: V2 = CITY.zrh, BER: V2 = CITY.ber, SFO: V2 = CITY.sf;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const qb = (p0: V2, c: V2, p2: V2, t: number): V2 => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]];
const qbTan = (p0: V2, c: V2, p2: V2, t: number): V2 => [2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]), 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1])];
/** Flight 1 control point: raised above the midpoint (bows up-left). Flight 2: high arc north over Greenland. */
const C1: V2 = [(ZRH[0] + BER[0]) / 2 - 12, (ZRH[1] + BER[1]) / 2 - 85];
const C2: V2 = [(BER[0] + SFO[0]) / 2 + 60, -2750];
// timeline (frames, local to the beat)
const MAP = { fly1: [fr(0.3), fr(T.mapBerlin)] as const, cam: [fr(T.mapBerlin + 0.3), fr(T.mapBerlin + 0.3) + 30] as const, fly2: [fr(T.mapBerlin + 0.3) + 4, 89] as const };
// camera = scale + where Berlin sits on screen (everything else follows from world coordinates)
const SC0 = 2.25, SC1 = 0.26;
const Q1 = (s: number): V2 => [500 + (BER[0] - (ZRH[0] + BER[0]) / 2) * s, 900 + (BER[1] - (ZRH[1] + BER[1]) / 2) * s];
const Q2: V2 = [500 + (BER[0] - 2510) * SC1, 890 + (BER[1] + 1358) * SC1];
const useCam = (f: number) => {
  const sA = SC0 * (1 + 0.05 * Math.min(1, f / MAP.cam[0]));
  const p = Easing.inOut(Easing.cubic)(ramp(f, MAP.cam[0], MAP.cam[1]));
  const s = Math.exp(Math.log(sA) * (1 - p) + Math.log(SC1) * p);
  const qa = Q1(sA);
  const q: V2 = [qa[0] + (Q2[0] - qa[0]) * p, qa[1] + (Q2[1] - qa[1]) * p];
  return { s, q, p, proj: (w: V2): V2 => [q[0] + (w[0] - BER[0]) * s, q[1] + (w[1] - BER[1]) * s] };
};
const PLANE = "M0,-50 C4,-50 6,-40 6,-30 L6,-12 L48,14 L48,24 L6,12 L5,34 L16,42 L16,48 L0,44 L-16,48 L-16,42 L-5,34 L-6,12 L-48,24 L-48,14 L-6,-12 L-6,-30 C-6,-40 -4,-50 0,-50 Z";
const HL = new Set(["Switzerland", "Germany", "United States of America"]);

/** Land polygons are static; memoised so each frame only re-projects the group transform. */
const Land = React.memo(() => (
  <>
    {COUNTRIES.map((c) => (
      <path key={c.name} d={c.d} fill="#e6e8ec" stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    ))}
  </>
));
const Tint = React.memo(({ name, o }: { name: string; o: number }) => {
  const c = COUNTRIES.find((x) => x.name === name);
  return c && o > 0.001 ? <path d={c.d} fill={RED} fillOpacity={o} stroke="none" /> : null;
});

const MapBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { s, q, p, proj } = useCam(frame);
  const f1 = Easing.inOut(Easing.sin)(ramp(frame, MAP.fly1[0], MAP.fly1[1]));
  const f2 = Easing.inOut(Easing.quad)(ramp(frame, MAP.fly2[0], MAP.fly2[1]));
  const T1 = 0.18;
  const tint = {
    "Switzerland": T1 * ramp(frame, 0, 6) * (1 - ramp(frame, 14, 30)),
    "Germany": T1 * ramp(frame, MAP.fly1[1] - 6, MAP.fly1[1] + 2) * (1 - ramp(frame, MAP.fly2[0], MAP.fly2[0] + 18)),
    "United States of America": T1 * ramp(frame, MAP.fly2[1] - 4, MAP.fly2[1] + 4),
  } as Record<string, number>;
  const trail = (p0: V2, c: V2, p2: V2, t: number) => {
    if (t <= 0.002) return "";
    const n = Math.max(2, Math.ceil(t * 80));
    let d = "";
    for (let i = 0; i <= n; i++) {
      const [x, y] = proj(qb(p0, c, p2, (t * i) / n));
      d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };
  // plane: flight 1, parked at Berlin (hidden under the pin), flight 2
  const inFlight2 = frame >= MAP.fly2[0] - 2;
  const tn = inFlight2 ? f2 : f1;
  const [pp0, pc, pp2] = inFlight2 ? [BER, C2, SFO] : [ZRH, C1, BER];
  const wpos = qb(pp0, pc, pp2, tn);
  const [tx, ty] = qbTan(pp0, pc, pp2, tn);
  const ang = (Math.atan2(ty, tx) * 180) / Math.PI + 90;
  const [px, py] = proj(wpos);
  const vis =
    Math.min(ramp(frame, 0, 5), 1 - ramp(frame, MAP.fly1[1] - 5, MAP.fly1[1] + 1)) + Math.min(ramp(frame, MAP.fly2[0] - 4, MAP.fly2[0] + 3), 1 - ramp(frame, MAP.fly2[1] - 4, MAP.fly2[1] + 1));
  const bob = 1 + 0.05 * Math.sin(frame * 0.35);
  const lift = 1 + 0.18 * Math.sin(Math.PI * (inFlight2 ? f2 : f1));
  const planeScale = (70 / 100) * bob * lift * (0.75 + 0.25 * vis);

  const pin = (w: V2, at: number, red = false, k = 1) => {
    const [x, y] = proj(w);
    const sp = frame < at ? 0 : spring({ frame: frame - at, fps: FPS, config: { damping: 11, stiffness: 180 } });
    if (sp <= 0.001) return null;
    return (
      <g opacity={k}>
        <circle cx={x} cy={y} r={26 * sp} fill="#fff" stroke={red ? RED : INK} strokeWidth={9} />
        <circle cx={x} cy={y} r={9 * sp} fill={red ? RED : INK} />
      </g>
    );
  };
  const label = (text: string, x: number, y: number, o: number, color: string, anchor: "start" | "end" = "start") =>
    o > 0.01 ? (
      <text x={x} y={y} fontSize={88} textAnchor={anchor} dominantBaseline="central" opacity={o} fill={color} stroke="#f6f7f9" strokeWidth={12} paintOrder="stroke" strokeLinejoin="round" style={{ ...FONTS.sans } as React.CSSProperties}>
        {text}
      </text>
    ) : null;
  const sp = (at: number) => (frame < at ? 0 : clamp01(spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 170 } })));
  const [zx, zy] = proj(ZRH), [bx, by] = proj(BER), [sx, sy] = proj(SFO);
  const zFade = 1 - ramp(frame, MAP.cam[0] - 2, MAP.cam[0] + 12);
  const bS = sp(MAP.fly1[1]);
  const sS = sp(MAP.fly2[1]);
  void s; void q;
  return (
    <AbsoluteFill style={{ background: "#f6f7f9" }}>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="planeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="10" dy="16" stdDeviation="9" floodColor="#000" floodOpacity="0.28" />
          </filter>
        </defs>
        <linearGradient id="southFade" gradientUnits="userSpaceOnUse" x1="0" y1="-520" x2="0" y2="-170">
          <stop offset="0" stopColor="#f6f7f9" stopOpacity="0" />
          <stop offset="1" stopColor="#f6f7f9" stopOpacity="1" />
        </linearGradient>
        <rect width="1080" height="1920" fill="#f6f7f9" />
        <g transform={`translate(${q[0]} ${q[1]}) scale(${s}) translate(${-BER[0]} ${-BER[1]})`}>
          <Land />
          {COUNTRIES.filter((c) => HL.has(c.name)).map((c) => (
            <Tint key={c.name} name={c.name} o={tint[c.name] ?? 0} />
          ))}
          {/* the generated country set stops at ~8°N: fade the land into the sea so no hard edge shows in the zoomed-out view */}
          <rect x={0} y={-520} width={7200} height={900} fill="url(#southFade)" />
        </g>
        <path d={trail(ZRH, C1, BER, f1)} fill="none" stroke={RED} strokeWidth={8} strokeDasharray="16 14" strokeLinecap="butt" />
        <path d={trail(BER, C2, SFO, f2)} fill="none" stroke={RED} strokeWidth={8} strokeDasharray="16 14" strokeLinecap="butt" />
        {pin(ZRH, 0, false, zFade)}
        {pin(BER, MAP.fly1[1])}
        {pin(SFO, MAP.fly2[1], true)}
        {label("Zürich", zx + 44, zy + 4, sp(0) * zFade, INK)}
        {label("Berlin", bx + 44 + (-300 - 44) * ramp(p, 0.45, 1), by + (-4 + 78 * ramp(p, 0, 0.5)), bS, INK)}
        {label("San Francisco", Math.max(36, sx - 70), sy + 92, sS, RED)}
        {vis > 0.01 ? (
          <g opacity={Math.min(1, vis)} filter="url(#planeShadow)">
            <g transform={`translate(${px} ${py}) rotate(${ang}) scale(${planeScale})`}>
              <path d={PLANE} fill={INK} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
            </g>
          </g>
        ) : null}
      </svg>
      <Words color={RED} words={words([{ t: T.mapNext, text: "next", font: "script", size: 230, x: 25, y: 14.5, color: RED, weight: 700 }])} />
    </AbsoluteFill>
  );
};

const SF: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Full file={M("sf.mp4")} frames={frames} zoom={1.1} start={0} />
    <Words
      color="#fff"
      shadow={WHITE_SHADOW}
      words={words([
        { t: 0.0, text: "San", font: "sans", size: 290, x: 48, y: 38 },
        { t: 0.25, text: "Francisco", font: "script", size: 232, x: 43, y: 50, weight: 700, color: RED },
      ])}
    />
  </AbsoluteFill>
);

const OpenDay: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Words
      color={INK}
      words={words([
        { t: T.open[0], text: "at CODE's open day", font: "elegant", size: 108, x: 48, y: 10.5 },
        { t: T.open[1], text: "I talked to", font: "sansLight", size: 96, x: 40, y: 16.5 },
        { t: T.open[2], text: "one", font: "sans", size: 195, x: 21, y: 23.5 },
        { t: T.open[2] + 0.2, text: "person", font: "script", size: 240, x: 65, y: 25.5, color: RED, weight: 700 },
      ])}
    />
    <Sequence from={fr(T.open[2])} layout="none">
      <Card file={M("santi_clip_rt.mp4")} label="" left={20} top={35} width={58} aspect={4 / 5} delay={0} zoom={1.04} />
    </Sequence>
  </AbsoluteFill>
);

/** Dorm: three full-bleed clips cut on the three captions, each in its own Sequence (starts from its first frame), zoom-punch + flash on each cut. */
const Dorm: React.FC<{ frames: number }> = ({ frames }) => {
  const cuts = [0, fr(T.dorm[1]), fr(T.dorm[2]), frames];
  const clips = ["dorm1.mp4", "dorm3.mp4", "dorm2.mp4"];
  return (
    <AbsoluteFill>
      {clips.map((c, i) => (
        <Sequence key={c} from={cuts[i]} durationInFrames={cuts[i + 1] - cuts[i]} layout="none" name={c}>
          <Full file={M(c)} frames={cuts[i + 1] - cuts[i]} zoom={1.1} punch={i > 0} />
        </Sequence>
      ))}
      <Cap
        items={[
          { t: T.dorm[0], text: "same dorm." },
          { t: T.dorm[1], text: "late nights.", font: "script", size: 190, color: RED, shadow: "0 0 18px rgba(255,255,255,0.95), 0 0 40px rgba(255,255,255,0.6), 0 3px 12px rgba(0,0,0,0.5)" },
          { t: T.dorm[2], text: "pivot after pivot.", font: "brush", size: 124 },
        ]}
      />
    </AbsoluteFill>
  );
};

const Stanford: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Full file={M("stanford.jpg")} frames={frames} zoom={1.06} dim={0} />
    <Words
      color={INK}
      words={words([
        { t: T.stan[0], text: "then", font: "sansLight", size: 104, x: 25, y: 12 },
        { t: T.stan[1], text: "Stanford", font: "sans", size: 236, x: 47, y: 19.5 },
        { t: T.stan[2], text: "changed everything", font: "brush", size: 140, x: 47, y: 28.5, color: RED },
        { t: T.stan[2] + 0.35, text: "summer 2026", font: "hand", size: 76, x: 72, y: 11, rotate: -6 },
      ])}
    />
  </AbsoluteFill>
);

/** Calendar flip for "t-t-two weeks later": two stutter lifts (page lifts and snaps back, in sync with the voice
 *  stutter), then 13 accelerating flips from day 1 to day 14, landing with a bounce. Frames are relative to the beat. */
export const CAL = (() => {
  const stutter = [0, 5];
  const flips: number[] = [];
  let f = 11;
  for (const step of [4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2]) {
    flips.push(f);
    f += step;
  }
  return { stutter, flips, land: f };
})();
const Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const done = CAL.flips.filter((x) => frame >= x + 3).length;
  const day = Math.min(14, 1 + done);
  const active = CAL.flips.find((x) => frame >= x && frame < x + 3);
  const lift = CAL.stutter.map((x) => interpolate(frame, [x, x + 2, x + 4], [0, -38, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })).reduce((a, b) => Math.min(a, b), 0);
  const flipAng = active !== undefined ? interpolate(frame, [active, active + 3], [0, -100]) : lift;
  const landS = spring({ frame: Math.max(0, frame - CAL.land), fps: FPS, config: { damping: 9, stiffness: 220 } });
  const scale = frame >= CAL.land ? interpolate(landS, [0, 1], [1.12, 1]) : 1;
  const shake = frame < CAL.land ? Math.sin(frame * 2.7) * (active !== undefined ? 3 : 1) : 0;
  const page = (n: number, extra: React.CSSProperties = {}) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: "22%", bottom: 0, background: "#fff", borderRadius: "0 0 34px 34px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", ...extra }}>
      <div style={{ fontSize: 330, lineHeight: 1, color: n === 14 ? RED : INK, ...FONTS.sans, fontWeight: 900, letterSpacing: "-0.06em", fontVariantNumeric: "tabular-nums" }}>{n}</div>
      <div style={{ fontSize: 46, color: "#6b7280", ...FONTS.hand, marginTop: 6 }}>{n === 14 ? "first device ✓" : "day " + n}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: "22%", width: "56%", top: "30%", aspectRatio: "0.82", transform: `scale(${scale}) rotate(${shake * 0.4}deg)`, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))", perspective: 1400 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#f3f4f6" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "22%", background: RED, borderRadius: "34px 34px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 64, letterSpacing: "0.2em", ...FONTS.sans }}>DAY</div>
      {[30, 70].map((x) => (
        <div key={x} style={{ position: "absolute", left: `${x}%`, top: -22, width: 26, height: 64, marginLeft: -13, borderRadius: 13, background: "#2b2b2e" }} />
      ))}
      {page(flipAng !== 0 ? Math.min(14, day + 1) : day)}
      {flipAng !== 0 ? page(day, { transformOrigin: "50% 0%", transform: `rotateX(${flipAng}deg)`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", backfaceVisibility: "hidden" }) : null}
    </div>
  );
};
/** "2 weeks" that stutters: jumps and doubles on each stutter lift, then locks in. */
const StutterTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const hits = [...CAL.stutter, 10];
  const k = hits.filter((h) => frame >= h).length;
  if (k === 0) return null;
  const since = frame - hits[k - 1];
  const jitter = k < hits.length ? Math.max(0, 1 - since / 4) : Math.max(0, 1 - since / 6);
  const text = k === 1 ? "2" : k === 2 ? "2 w" : "2 weeks";
  return (
    <div style={{ position: "absolute", left: 0, right: "6%", top: "8%", textAlign: "center", transform: `translate(${jitter * 14}px, ${-jitter * 8}px)` }}>
      {jitter > 0.2 ? <div style={{ position: "absolute", inset: 0, fontSize: 215, color: RED, opacity: 0.45, transform: "translate(-10px, 6px)", ...FONTS.sans }}>{text}</div> : null}
      <div style={{ position: "relative", fontSize: 215, color: INK, ...FONTS.sans }}>{text}</div>
    </div>
  );
};
const Build: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  void frames;
  const devAt = fr(T.build.device - 0.1);
  const sw = [devAt, fr(T.build.mount), fr(T.build.pilot)];
  const shots = [M("device.jpg"), M("mount.jpg"), M("pilot.jpg")];
  const i = frame >= sw[2] ? 2 : frame >= sw[1] ? 1 : 0;
  const calOut = interpolate(frame, [devAt - 4, devAt + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <StutterTitle />
      <Words color={INK} words={words([{ t: T.build.later, text: "later", font: "brush", size: 175, x: 71, y: 23, color: RED, rotate: -4 }])} />
      {calOut > 0 ? (
        <AbsoluteFill style={{ opacity: calOut, transform: `translateY(${(1 - calOut) * -60}px)` }}>
          <Calendar />
        </AbsoluteFill>
      ) : null}
      {frame >= devAt ? (
        <Sequence from={sw[i]} layout="none">
          <Card file={shots[i]} label="" left={i === 2 ? 10 : 20} top={34} width={i === 2 ? 76 : 60} aspect={i === 2 ? 4 / 3 : 4 / 5} delay={0} zoom={1.06} />
        </Sequence>
      ) : null}
      {frame >= devAt ? (
        <div style={{ position: "absolute", left: 0, right: "6%", top: "27%", textAlign: "center", fontSize: 100, color: i === 2 ? RED : INK, ...FONTS.hand }}>{i === 0 ? "our first device" : i === 1 ? "on real cars" : "our first pilot"}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Tech: waveform card with anomaly, big "4 weeks in advance". */
const Tech: React.FC = () => {
  const frame = useCurrentFrame();
  const alertAt = fr(T.tech[2]);
  const as = spring({ frame: Math.max(0, frame - alertAt), fps: FPS, config: { damping: 11, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ background: "#f4f5f7" }}>
      <Words
        color={INK}
        words={words([
          { t: 0.05, text: "next-gen tech that", font: "elegant", size: 100, x: 47, y: 10.5 },
          { t: T.tech[1], text: "predicts", font: "sans", size: 124, x: 30, y: 16 },
          { t: T.tech[1] + 0.22, text: "vehicle issues", font: "brush", size: 118, x: 55, y: 21.5, color: RED },
          { t: T.tech[3], text: "4 weeks", font: "sans", size: 215, x: 44, y: 64.5, color: RED },
          { t: T.tech[4], text: "in advance", font: "script", size: 190, x: 45, y: 73.5, weight: 700 },
        ])}
      />
      <div style={{ position: "absolute", left: "7%", width: "78%", top: "27%", height: "31%", background: "#fff", borderRadius: 34, boxShadow: "0 12px 40px rgba(0,0,0,0.10)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 40, top: 34, fontSize: 32, color: "#6b7280", letterSpacing: "0.12em", ...FONTS.sansLight }}>MSU · LIVE · ACOUSTIC</div>
        <div style={{ position: "absolute", right: 40, top: 40, width: 18, height: 18, borderRadius: 9, background: frame >= alertAt ? RED : GREEN }} />
        <div style={{ position: "absolute", left: 40, right: 40, top: 100, bottom: 160, display: "flex", alignItems: "center", gap: 6 }}>
          {Array.from({ length: 56 }, (_, i) => {
            const anomaly = i > 34 && i < 46;
            const base = 0.2 + 0.14 * Math.abs(Math.sin(i * 0.9 + frame * 0.35)) + 0.08 * Math.abs(Math.sin(i * 2.3 - frame * 0.21));
            const boost = anomaly ? interpolate(frame, [alertAt - 12, alertAt], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7 + frame * 0.5))) : 0;
            return <div key={i} style={{ flex: 1, height: `${Math.min(1, base + boost) * 100}%`, borderRadius: 6, background: anomaly && frame >= alertAt - 6 ? RED : "#1f2937" }} />;
          })}
        </div>
        {frame >= alertAt ? (
          <div
            style={{
              position: "absolute",
              left: 30,
              right: 30,
              bottom: 26,
              background: INK,
              color: "#fff",
              borderRadius: 22,
              padding: "20px 28px",
              transform: `scale(${interpolate(as, [0, 1], [0.85, 1])})`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 34, ...FONTS.sans, letterSpacing: "-0.02em" }}>⚠ Brake pad wear</span>
            <span style={{ fontSize: 31, color: "#86efac", ...FONTS.serifItalic }}>~4 weeks to failure</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Works: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: Math.max(0, frame - 4), fps: FPS, config: { damping: 9, stiffness: 190 } });
  const sk = frame >= 4 ? Math.max(0, 1 - (frame - 4) / 6) : 0;
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={frames} layout="none" name="works.mp4">
        <Full file={M("works.mp4")} frames={frames} zoom={1.08} dim={0.5} />
      </Sequence>
      <div style={{ position: "absolute", left: 0, right: "12%", top: "24%", textAlign: "center", color: "#fff", textShadow: WHITE_SHADOW, transform: `translate(${Math.sin(frame * 3.7) * 8 * sk}px, ${Math.cos(frame * 4.3) * 6 * sk}px)` }}>
        <div style={{ fontSize: 175, lineHeight: 1.05, ...FONTS.hand, transform: `rotate(${interpolate(s, [0, 1], [-8, -3])}deg)` }}>and it</div>
        <div style={{ fontSize: 255, lineHeight: 1.05, ...FONTS.sans, fontWeight: 900, letterSpacing: "-0.04em", transform: `scale(${interpolate(s, [0, 1], [1.35, 1])}) rotate(${interpolate(s, [0, 1], [4, 0])}deg)` }}>works.</div>
        <div style={{ margin: "34px auto 0", width: 140, height: 140, borderRadius: 70, background: GREEN, color: "#fff", fontSize: 98, lineHeight: "140px", transform: `scale(${s})`, textShadow: "none", ...FONTS.sans }}>✓</div>
      </div>
      <Swoosh at={9} x1={100} x2={845} y={880} shadow />
    </AbsoluteFill>
  );
};

/** Outro: FounderIntro's B9 with Juan's mic clip, plus "follow along" at the end. */
const Outro: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <B9 p={P} frames={frames} line2={T.outro[0]} last={T.outro[1]} />
    <Words color={INK} words={words([{ t: T.outro[2], text: "follow along →", font: "hand", size: 92, x: 42, y: 77.5, rotate: -3, color: RED }])} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ sound
const cuesFor = (S: number[], D: number[]): Cue[] => {
  const c: Cue[] = [];
  const at = (i: number, s: number) => S[i] + fr(s);
  const key = (i: number, s: number, n: number, name: string) => c.push({ at: at(i, s - 0.1), s: (["key1", "key2", "key3"] as SoundName[])[n % 3], vol: 0.07, name });
  c.push({ at: 0, s: "shutterSlr3", vol: 0.07, name: "hook" });
  key(0, T.hook[0] + 0.1, 0, "I left");
  key(0, T.hook[1], 1, "Zürich");
  key(0, T.hook[2], 2, "to chase my");
  c.push({ at: at(0, T.hook[3] - 0.1), s: "pencil1", vol: 0.045, name: "dream" });
  c.push({ at: S[1] + 8, s: "road_map_unfold", vol: 0.17, name: "map unfolds (peak just after the cut)" });
  c.push({ at: S[1] + MAP.fly1[0], s: "pencil2", vol: 0.03, name: "trail Zürich → Berlin" });
  c.push({ at: S[1] + MAP.fly2[0] + 2, s: "pencil2", vol: 0.03, name: "trail Berlin → SF" });
  c.push({ at: S[2], s: "airplanePass", vol: 0.19, name: "plane: Berlin → SF (peak on the cut)" });
  c.push({ at: at(1, T.mapBerlin), s: "airplane_pass1_flyby", vol: 0.21, name: "plane: Zürich → Berlin (peak at Berlin)" });
  c.push({ at: S[3], s: "page2", vol: 0.08, name: "open day" });
  c.push({ at: at(3, T.open[2]), s: "shutterInsta2", vol: 0.085, name: "duo photo" });
  c.push({ at: S[4], s: "riffle1", vol: 0.08, name: "grid" });
  c.push({ at: at(4, T.hl), s: "shutterDslr", vol: 0.12, name: "Santi" });
  c.push({ at: at(4, T.hl + 0.1), s: "pencil1", vol: 0.045, name: "co-founder" });
  c.push({ at: S[5], s: "key1", vol: 0.07, name: "same dorm" });
  c.push({ at: at(5, T.dorm[1] - 0.05), s: "key2", vol: 0.07, name: "late nights" });
  c.push({ at: at(5, T.dorm[2] - 0.05), s: "key3", vol: 0.07, name: "pivot" });
  c.push({ at: S[6], s: "swish", vol: 0.05, name: "Stanford" });
  void D;
  // calendar: stutter lifts, flips, landing
  CAL.stutter.forEach((f, k) => {
    c.push({ at: S[7] + f, s: k ? "flapHi" : "flap", vol: 0.05, name: `cal stutter ${k + 1}` });
    c.push({ at: S[7] + f + 2, s: "page_turn_single", vol: 0.17, name: `cal stutter ${k + 1} (page lift)` });
  });
  // multi page flip under the fast flips: its loud part (0.6–1.7 s into the file) lines up with flips 1–13
  c.push({ at: S[7] + CAL.flips[0] + 4, s: "pages_flip_multi", vol: 0.13, name: "cal fast flips (pages)" });
  CAL.flips.forEach((f, k) => c.push({ at: S[7] + f, s: (["flapLo", "flap", "flapHi"] as SoundName[])[[1, 0, 2, 0, 1, 2, 0][k % 7]], vol: 0.028 + 0.002 * k, name: `cal flip ${k + 1}` }));
  c.push({ at: S[7] + CAL.land, s: "flapEnd1", vol: 0.05, name: "cal land" });
  c.push({ at: S[7] + CAL.land, s: "cardPlace1", vol: 0.08, name: "cal land (thud)" });
  const bt = [T.build.device - 0.1, T.build.mount, T.build.pilot];
  for (let k = 0; k < 3; k++) {
    c.push({ at: S[7] + fr(bt[k]), s: (["shutterSlr2", "shutter3", "shutterInsta1"] as SoundName[])[k], vol: 0.09, name: `build ${k + 1}` });
    c.push({ at: S[7] + fr(bt[k]), s: "page_turn_single", vol: 0.17, name: `build ${k + 1} (photo swap)` });
  }
  for (let k = 0; k < 17; k++) c.push({ at: S[8] + 6 + k * 2, s: (["shutter3", "shutterInsta1", "shutterDslr"] as SoundName[])[k % 3], vol: 0.03 + 0.002 * k, name: `wall ${k + 1}` });
  c.push({ at: S[8] + fr(T.brand) - fr(0.64), s: "riser1", vol: 0.05, name: "riser" });
  c.push({ at: at(8, T.brand), s: "tom1", vol: 0.14, name: "MANTAI" });
  c.push({ at: S[9], s: "switch2", vol: 0.08, name: "sensor on" });
  c.push({ at: at(9, T.tech[2]), s: "clink1", vol: 0.05, name: "alert" });
  c.push({ at: S[10], s: "tom1", vol: 0.1, name: "it works" });
  c.push({ at: S[11], s: "camera_shutter_nikon", vol: 0.16, name: "outro card (Nikon)" });
  c.push({ at: at(11, 0.45), s: "pencil1", vol: 0.045, name: "squiggle" });
  // --- extra sound design (v3) ---
  c.push({ at: at(0, T.hook[1] - 0.05), s: "swishSmall", vol: 0.035, name: "Zürich (air)" });
  c.push({ at: at(1, T.mapBerlin), s: "cardPlace1", vol: 0.06, name: "Berlin pin" });
  c.push({ at: S[1] + MAP.fly2[1], s: "cardPlace1", vol: 0.06, name: "SF pin" });
  key(3, T.open[1], 1, "I talked to");
  c.push({ at: at(3, T.open[2] + 0.15), s: "pencil1", vol: 0.045, name: "person (pencil)" });
  c.push({ at: S[4] + 1, s: "flapBurst8", vol: 0.03, name: "faces appear" });
  for (let k = 0; k < 9; k++) c.push({ at: at(5, 0.35) + k * 3, s: (["key1", "key2", "key3"] as SoundName[])[k % 3], vol: 0.03, name: `typing ${k + 1}` });
  c.push({ at: at(5, T.dorm[2]), s: "switch", vol: 0.04, name: "pivot 1" });
  c.push({ at: at(5, T.dorm[2] + 0.45), s: "switch2", vol: 0.05, name: "pivot 2" });
  c.push({ at: S[6], s: "camera_shutter_nikon", vol: 0.16, name: "Stanford photo (Nikon)" });
  c.push({ at: at(6, T.stan[2]), s: "pencil2", vol: 0.04, name: "changed everything (pen)" });
  c.push({ at: at(6, T.stan[2] + 0.35), s: "pen2", vol: 0.06, name: "summer 2026 (note)" });
  c.push({ at: at(9, T.tech[1]), s: "mouse2", vol: 0.05, name: "predicts (click)" });
  c.push({ at: at(9, T.tech[3]), s: "tom1", vol: 0.06, name: "4 weeks (hit)" });
  c.push({ at: at(9, T.tech[4]), s: "pencil1", vol: 0.04, name: "in advance (pen)" });
  c.push({ at: S[10] + 5, s: "clink1", vol: 0.06, name: "check ✓" });
  c.push({ at: S[10] + 4, s: "crowd_yeah_applause", vol: 0.06, name: "and it works (cheer)" });
  c.push({ at: at(11, T.outro[2]), s: "pencil2", vol: 0.04, name: "follow along (pen)" });
  c.push({ at: at(11, T.outro[1] - 0.05), s: "pencil2", vol: 0.04, name: "beginning" });
  // v5: cuts inside beats (rope whoosh), pen clicks on caption pops
  c.push({ at: at(0, T.hook[2]), s: "whoosh_rope", vol: 0.1, name: "hook → moto cut" });
  c.push({ at: at(5, T.dorm[1]), s: "whoosh_rope", vol: 0.1, name: "dorm cut 1" });
  c.push({ at: at(5, T.dorm[2]), s: "whoosh_rope", vol: 0.1, name: "dorm cut 2" });
  for (const [i, s, n] of [[5, T.dorm[0] + 0.03, "same dorm"], [5, T.dorm[1] + 0.03, "late nights"], [5, T.dorm[2] + 0.03, "pivot"], [6, T.stan[0] + 0.03, "then"], [6, T.stan[1], "Stanford"], [3, T.open[0], "open day"], [9, T.tech[1], "predicts"], [11, T.outro[1], "beginning"]] as [number, number, string][])
    c.push({ at: at(i, s), s: "pen_click", vol: 0.5, name: `pop · ${n}` });
  // quiet whoosh on each beat cut (skip 2: airplane peaks there; skip 8: climax has its own riser/drum)
  const wh = ["whooshShort", "swishSmall", "swish"] as SoundName[];
  let k = 0;
  for (let i = 1; i < S.length; i++) {
    if (i === 2 || i === 8) continue;
    c.push({ at: S[i], s: wh[k % 3], vol: 0.035, name: `cut ${i + 1} (whoosh)` });
    k++;
  }
  return c;
};

/** Beat entrance (first 7 frames, not on beat 0), cycling: zoom-in + blur, slide up, whip with motion blur. */
const ENTER = 7;
const Enter: React.FC<{ i: number; children: React.ReactNode }> = ({ i, children }) => {
  const frame = useCurrentFrame();
  if (i === 0 || frame >= ENTER) return <AbsoluteFill>{children}</AbsoluteFill>;
  const e = Easing.out(Easing.cubic)(frame / ENTER);
  const k = 1 - e;
  const style = (i - 1) % 3;
  const st: React.CSSProperties =
    style === 0
      ? { transform: `scale(${1 + 0.08 * k})`, filter: `blur(${12 * k}px)`, opacity: 0.3 + 0.7 * e }
      : style === 1
        ? { transform: `translateY(${80 * k}px) scale(${1 + 0.04 * k})`, opacity: 0.3 + 0.7 * e }
        : { transform: `translateX(${120 * k}px) scale(${1 + 0.07 * k})`, filter: `blur(${10 * k}px)`, opacity: 0.5 + 0.5 * e };
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

// ------------------------------------------------------------------ composition
export const FounderMix: React.FC<MixProps> = (props) => {
  const p: MP = mixSchema.parse(props);
  const S = starts(p.durs);
  const F = p.durs.map(fr);
  const total = S[11] + F[11];
  const beats: React.ReactNode[] = [
    <Hook frames={F[0]} />,
    <MapBeat />,
    <SF frames={F[2]} />,
    <OpenDay />,
    <B5 p={P} hl={T.hl} />,
    <Dorm frames={F[5]} />,
    <Stanford frames={F[6]} />,
    <Build frames={F[7]} />,
    <B6 p={P} brand={T.brand} swoosh />,
    <Tech />,
    <Works frames={F[10]} />,
    <Outro frames={F[11]} />,
  ];
  const climax = S[8] + fr(T.brand);
  const musicGain = (f: number) =>
    interpolate(f, [climax - 18, climax - 12, climax - 1, climax], [1, 0.12, 0.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(f, [total - 20, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {p.voiceover ? <Audio src={staticFile(p.voiceover)} volume={p.voVolume} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={(f) => p.musicVolume * musicGain(f)} /> : null}
      <SfxTrack cues={cuesFor(S, p.durs)} volume={p.sfxVolume} />
      {beats.map((b, i) => (
        <Sequence key={i} from={S[i]} durationInFrames={F[i]} name={NAMES[i]}>
          <Enter i={i}>{b}</Enter>
        </Sequence>
      ))}
      {p.safeZones ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};

/** Areas covered by TikTok / Instagram Reels UI (union of both apps): top bar, right action column, bottom caption. */
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "7%", background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", right: 0, width: "15%", top: "45%", bottom: "20%", background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "20%", background: "rgba(255,0,0,0.28)" }} />
  </AbsoluteFill>
);

export const mixDefaults: MP = mixSchema.parse({});
