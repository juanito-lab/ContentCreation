// FounderMix v8: Jasper's graphic beats (map, avatar grid, photo wall, alert card, squiggle outro) mixed with Santi's style
// (real full-bleed footage, centred subtitles, mixed-font text stacks, "follow along" close). Real media in public/mix/. ~35 s.
// Rules of this cut: fast (no shot holds longer than ~1.2 s, hard cuts with zoom-punch + flash), no slow motion (every clip plays at 1×),
// never a black or empty frame (graphics sit on footage/photos or on the light map), text only in black, white or red.
//
//  1 Hook      Zürich sunset → motorbike (2 cuts)        "I left Zürich to chase my dream."
//  2 Map       Zürich → Berlin → SF, plane, light map     "Zürich. Berlin. Next:"
//  3 SF        SF skyline → bay-view office                  "…San Francisco."
//  4 Open day  CODE building → crowd → CODE office card → Santi clip → Santi → duo   "At CODE's open day, I talked to exactly one person."
//  5 Grid      CODE office → avatar grid on crowd photos → Santiago     "Out of everyone there, he's now my co-founder."
//  6 Dorm      4 cuts of laptop/build nights (beanbag photo swapped for the real MSU-build photo)   "Same dorm. Late nights. Pivot after pivot."
//  7 Stanford  plane window → Stanford podium (held, re-punch)   "Then Stanford changed everything."
//  8 Build     calendar → device → mount → pilot → road   "Two weeks later: our first device. Our first pilot."
//  9 MantAI    photo wall on office footage → MANTAI      "Together, we're building MantAI."   (climax)
// 10 Tech      waveform + alert on 4 backdrops            "Next-gen tech that predicts vehicle issues up to four weeks in advance."
// 11 Works     device on the dash, ✓                      "And it works."
// 12 Outro     Juan with mic, squiggle                    "I'm Juan. This is only the beginning."
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { FONTS } from "./lib/fonts";
import { Words, WHITE_SHADOW } from "./lib/words";
import { CITY, COUNTRIES } from "./lib/worldmap";
import { SfxTrack } from "./lib/sfx";
import { CAL, FPS, MAP, MIX_DURS, T, TL, fr } from "./lib/mixtimes";
import { cuesFor } from "./lib/mixcues";
import { B6, B9, Card, Media, Sub, Swoosh, founderSchema, words } from "./FounderIntro";

export { CAL, MIX_DURS };
const RED = "#E10600";
const GREEN = "#12b76a"; // status dot + check badge (shapes, not text)
const INK = "#0b0b0c";
const NAMES = ["1 Hook", "2 Map", "3 SF", "4 Open day", "5 Grid", "6 Dorm", "7 Stanford", "8 Build", "9 MantAI (climax)", "10 Tech", "11 It works", "12 Outro"];

export const mixSchema = z.object({
  voiceover: z.string().default("vo/juan-t5-v6.wav"),
  /** keep Juan's voice low in the mix */
  voVolume: z.number().min(0).max(1).default(0.35),
  /** v13: no default track — Juan adds his own music (172 BPM) directly in TikTok/IG's audio tool once he's
   *  posting, never embedded here. public/music/licensed_track.wav from v12 is left on disk but unused. */
  music: z.string().default(""),
  musicVolume: z.number().min(0).max(1).default(0),
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
// v8: w11.jpg (beanbag) dropped from the wall too — w4.jpg (MSU install in the car) takes its slot. w12.jpg (desk, two
// monitors) moved out of the wall into its own Dorm cut (below), so w13.jpg (MSU device install) takes its wall slot instead.
const WALL = ["w1.jpg", "w10.jpg", "w3.jpg", "w4.jpg", "w6.jpg", "w7.jpg", "w8.jpg", "w9.jpg", "w13.jpg", "santi.jpg", "w14.jpg", "w15.jpg", "w16.jpg", "w17.jpg", "pilot.jpg", "device.jpg", "duo.jpg"].map(M);
/** Reuse FounderIntro beats with Juan's real media. */
const P = founderSchema.parse({ duo: M("duo.jpg"), santi: M("santi_face2.jpg"), juan2: M("outro.mp4"), wall: WALL });

// ------------------------------------------------------------------ helpers
/** Cut transition: zoom-punch (scale 1.18 → 1 with a touch of blur) + white flash over the first 4 frames, local to the enclosing Sequence. */
const usePunch = (on: boolean) => {
  const frame = useCurrentFrame();
  return { k: on ? 1 - Easing.out(Easing.cubic)(Math.min(1, frame / 6)) : 0, flash: on ? Math.max(0, 1 - frame / 4) * 0.5 : 0 };
};

/** Full-bleed clip/photo with slow push-in and a soft top/bottom gradient for legibility.
 *  rePunchAt: an extra zoom-punch + flash partway through the SAME shot (local frame, no new Sequence/cut) — used where a
 *  beat needs a second visual accent without cutting to new or repeated footage (v8: Stanford's extended photo hold). */
const Full: React.FC<{ file: string; zoom?: number; frames: number; start?: number; dim?: number; punch?: boolean; bright?: number; rePunchAt?: number }> = ({ file, zoom = 1.08, frames, start = 0, dim = 0.35, punch = false, bright = 1, rePunchAt }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, frames], [1, zoom], { extrapolateRight: "clamp" });
  const { k, flash } = usePunch(punch);
  const r2 = rePunchAt !== undefined ? Math.max(0, frame - rePunchAt) : -1;
  const k2 = r2 >= 0 ? 1 - Easing.out(Easing.cubic)(Math.min(1, r2 / 6)) : 0;
  const flash2 = r2 >= 0 ? Math.max(0, 1 - r2 / 4) * 0.5 : 0;
  const totalFlash = Math.max(flash, flash2);
  return (
    <AbsoluteFill style={{ background: "#2a2f38" }}>
      <AbsoluteFill style={{ transform: `scale(${z * (1 + 0.18 * k + 0.14 * k2)})`, filter: bright !== 1 ? `brightness(${bright})` : undefined }}>
        <Media file={file} label="" start={start} />
      </AbsoluteFill>
      {totalFlash > 0 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${totalFlash})` }} /> : null}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${dim}) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,${dim}) 100%)` }} />
    </AbsoluteFill>
  );
};

/** Soft, blurred real footage behind graphics (so a graphics beat never sits on a flat colour). tint = veil over the blur. */
const Backdrop: React.FC<{ file: string; start?: number; blur?: number; tint?: string; punch?: boolean; bright?: number }> = ({ file, start = 0, blur = 12, tint = "rgba(255,255,255,0.5)", punch = false, bright = 1.05 }) => {
  const { k, flash } = usePunch(punch);
  return (
    <AbsoluteFill style={{ background: "#c9ced6" }}>
      <AbsoluteFill style={{ transform: `scale(${1.14 * (1 + 0.14 * k)})`, filter: `blur(${blur}px) brightness(${bright}) saturate(1.2)` }}>
        <Media file={file} label="" start={start} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: tint }} />
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${flash})` }} /> : null}
    </AbsoluteFill>
  );
};

/** The last shot of a beat keeps running this many frames past the beat (the next beat's entrance plays on top of it). */
const TAIL = 8;

/** Hard-cut shot list: each shot in its own Sequence (clips start from their first frame, zoom-punch + flash on every cut after the first). */
type Shot = { f: number; file: string; start?: number; zoom?: number; bright?: number; rePunchAt?: number };
const Shots: React.FC<{ shots: Shot[]; total: number; mode?: "full" | "backdrop"; dim?: number; blur?: number; tint?: string; enter?: boolean }> = ({ shots, total, mode = "full", dim = 0.35, blur, tint, enter = true }) => (
  <AbsoluteFill>
    {shots.map((s, i) => {
      const len = Math.max(1, (i + 1 < shots.length ? shots[i + 1].f : total) - s.f);
      return (
        <Sequence key={`${s.f}-${s.file}`} from={s.f} durationInFrames={len + (i + 1 < shots.length ? 0 : TAIL)} layout="none" name={s.file}>
          {mode === "full" ? <Full file={s.file} frames={len} start={s.start ?? 0} zoom={s.zoom ?? 1.1} dim={dim} bright={s.bright} punch={i > 0 || enter} rePunchAt={s.rePunchAt} /> : <Backdrop file={s.file} start={s.start ?? 0} blur={blur} tint={tint} punch={i > 0 || enter} />}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

/** Card whose media swaps with a hard cut (first shot pops in, the later ones are already settled and get the punch). */
type CardShot = { f: number; file: string; start?: number };
const CardShots: React.FC<{ shots: CardShot[]; total: number; left: number; top: number; width: number; aspect: number; zoom?: number; tail?: number }> = ({ shots, total, left, top, width, aspect, zoom = 1.04, tail = TAIL }) => (
  <AbsoluteFill>
    {shots.map((s, i) => {
      const len = Math.max(1, (i + 1 < shots.length ? shots[i + 1].f : total) - s.f);
      return (
        <Sequence key={`${s.f}-${s.file}`} from={s.f} durationInFrames={len + (i + 1 < shots.length ? 0 : tail)} layout="none" name={`card ${s.file}`}>
          <Punch on={i > 0}>
            <Card file={s.file} label="" left={left} top={top} width={width} aspect={aspect} delay={i === 0 ? 0 : -24} zoom={zoom} />
          </Punch>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
const Punch: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => {
  const { k, flash } = usePunch(on);
  return (
    <AbsoluteFill style={{ transform: k > 0.01 ? `scale(${1 + 0.1 * k})` : undefined }}>
      {children}
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,255,255,${flash * 0.8})` }} /> : null}
    </AbsoluteFill>
  );
};

/** "Santiago" in big red script, a small hand-written note and an arrow (px on the 1080x1920 canvas). v7: fully static, it appears on one frame. */
const NameTag: React.FC<{ at: number; x: number; y: number; size?: number; sub?: string; subX?: number; subY?: number; arrow?: [number, number, number, number, number, number] }> = ({ at, x, y, size = 190, sub, subX = 0, subY = 0, arrow }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const halo = "0 0 18px #fff, 0 0 8px #fff, 0 0 3px #fff";
  let head: string[] = [];
  if (arrow) {
    const [, , cx, cy, x1, y1] = arrow;
    const a = Math.atan2(y1 - cy, x1 - cx);
    head = [-0.45, 0.45].map((d) => `M ${x1} ${y1} L ${x1 - 46 * Math.cos(a + d)} ${y1 - 46 * Math.sin(a + d)}`);
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%) rotate(-6deg)", color: RED, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", textShadow: halo, ...FONTS.script }}>Santiago</div>
      {sub ? (
        <div style={{ position: "absolute", left: subX, top: subY, transform: "translate(-50%, -50%) rotate(-4deg)", color: INK, fontSize: 84, lineHeight: 1, whiteSpace: "nowrap", textShadow: halo, ...FONTS.serif }}>
          {sub}
        </div>
      ) : null}
      {arrow ? (
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 6px #fff)" }}>
          {[`M ${arrow[0]} ${arrow[1]} Q ${arrow[2]} ${arrow[3]} ${arrow[4]} ${arrow[5]}`, ...head].map((d, i) => (
            <path key={i} d={d} fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** Santi-style centred subtitle: bold white, one phrase at a time. */
type CapItem = { t: number; text: string; font?: keyof typeof FONTS; size?: number; color?: string; shadow?: string };
const Cap: React.FC<{ items: CapItem[]; y?: number; size?: number }> = ({ items, y = 38, size = 96 }) => {
  const frame = useCurrentFrame();
  const cur = [...items].reverse().find((i) => frame >= Math.max(0, fr(i.t - 0.05)));
  if (!cur) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "16%",
        top: `${y}%`,
        transform: "translateY(-50%)",
        textAlign: "center",
        color: cur.color ?? "#fff",
        fontSize: cur.size ?? size,
        lineHeight: 1.05,
        textShadow: cur.shadow ?? WHITE_SHADOW,
        ...FONTS[cur.font ?? "sans"],
      }}
    >
      {cur.text}
    </div>
  );
};

// ------------------------------------------------------------------ beats
/** Hook: Zürich sunset, hard cut to the motorbike on the lake road at "to chase my", a jump cut further down the road at "dream". */
const Hook: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Shots
      total={frames}
      dim={0.45}
      enter={false}
      shots={[
        { f: 0, file: M("hook.mp4"), zoom: 1.1 },
        { f: TL.hook.moto, file: M("moto.mp4"), zoom: 1.1 },
        { f: TL.hook.moto2, file: M("moto.mp4"), start: 2.0, zoom: 1.12 },
      ]}
    />
    <Words
      color="#fff"
      shadow={WHITE_SHADOW}
      words={words([
        { t: T.hook[0], text: "I left", font: "serif", size: 108, x: 26, y: 15.1 }, // v14: was y:12 — top edge sat above the 220px safe line
        // v16: the whole stack re-spaced (was y:21.5/31/46) — at these font sizes (108/270/130/392-effective) the old
        // gaps were smaller than the half-heights involved, so "I left" clipped into "Zürich" and "Zürich" clipped into
        // "to chase my" (Juan flagged "I left" crossing "Zürich"). Each line now sits a clear ~26px below the one above.
        { t: T.hook[1], text: "Zürich", font: "sans", size: 270, x: 46, y: 26.3 },
        { t: T.hook[2], text: "to chase my", font: "serif", size: 130, x: 34, y: 38.1 },
        { t: T.hook[3], text: "dream", font: "script", size: 350, x: 41, y: 53, color: RED, weight: 700 },
      ])}
    />
  </AbsoluteFill>
);

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
// timeline (frames, local to the beat): see lib/mixtimes.ts (MAP) — flight 1 / camera pull-out / flight 2 + the plane shrinking into each pin
// camera = scale + where Berlin sits on screen (everything else follows from world coordinates)
const SC0 = 2.25, SC1 = 0.26;
const Q1 = (s: number): V2 => [500 + (BER[0] - (ZRH[0] + BER[0]) / 2) * s, 900 + (BER[1] - (ZRH[1] + BER[1]) / 2) * s];
const Q2: V2 = [500 + (BER[0] - 2510) * SC1, 890 + (BER[1] + 1358) * SC1];
const useCam = (f: number) => {
  const sA = SC0; // v7: no slow drift before the pull-out, so the labels stay put next to their pins
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
  // the plane flies in, then shrinks into the pin over 9 frames (the plane whoosh ends with that)
  const land1 = ramp(frame, MAP.fly1[1], MAP.land1), land2 = ramp(frame, MAP.fly2[1], MAP.land2);
  const vis = Math.min(ramp(frame, 0, 5), 1 - land1) + Math.min(ramp(frame, MAP.fly2[0] - 4, MAP.fly2[0] + 3), 1 - land2);
  const bob = 1 + 0.05 * Math.sin(frame * 0.35);
  const lift = 1 + 0.18 * Math.sin(Math.PI * (inFlight2 ? f2 : f1));
  const planeScale = (70 / 100) * bob * lift * (0.75 + 0.25 * vis) * (1 - 0.45 * (inFlight2 ? land2 : land1));

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
  // v7: map labels are static text. Each appears on one frame at a fixed spot (next to its pin while the camera is parked, and at the
  // pin's final spot after the pull-out) and never moves; they hard-cut off/on when the camera starts to move.
  const pre = useCam(0).proj, fin = useCam(MAP.cam[1]).proj;
  const [zx, zy] = pre(ZRH), [bx, by] = pre(BER), [fbx, fby] = fin(BER), [sx, sy] = fin(SFO);
  const camMoving = frame >= MAP.cam[0];
  void s; void q; void p; void sp;
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
        {pin(ZRH, 0, false, camMoving ? 0 : 1)}
        {pin(BER, MAP.fly1[1])}
        {pin(SFO, MAP.fly2[1], true)}
        {label("Zürich", zx + 44, zy + 4, camMoving ? 0 : 1, INK)}
        {label("Berlin", bx + 44, by - 4, frame >= MAP.fly1[1] && !camMoving ? 1 : 0, INK)}
        {label("Berlin", fbx - 300, fby + 74, camMoving ? 1 : 0, INK)}
        {label("San Francisco", Math.max(36, sx - 70), sy + 92, frame >= MAP.fly2[1] ? 1 : 0, RED)}
        {vis > 0.01 ? (
          <g opacity={Math.min(1, vis)} filter="url(#planeShadow)">
            <g transform={`translate(${px} ${py}) rotate(${ang}) scale(${planeScale})`}>
              <path d={PLANE} fill={INK} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
            </g>
          </g>
        ) : null}
      </svg>
      <Words color={RED} words={words([{ t: T.mapNext, text: "next", font: "script", size: 230, x: 25, y: 19, color: RED, weight: 700 }])} /> {/* v14: was y:14.5 — cleared the 220px safe line */}
    </AbsoluteFill>
  );
};

const SF: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Shots
      total={frames}
      shots={[
        { f: 0, file: M("sf.mp4"), zoom: 1.1 },
        { f: TL.sf.bridge, file: M("dash.mp4"), start: 2.5, zoom: 1.12 },
      ]}
    />
    <Words
      color="#fff"
      shadow={WHITE_SHADOW}
      words={words([
        { t: 0.0, text: "San", font: "sans", size: 290, x: 48, y: 38 },
        // v14: x 44.5→38 — the flourish on the final "o" was crossing into the right-side 945px safe column (Juan's reference).
        { t: 0.25, text: "Francisco", font: "script", size: 232, x: 38, y: 50, weight: 700, color: RED },
      ])}
    />
  </AbsoluteFill>
);

/** Open day: crowd photo, then at "talked to" Santi's clip lands on a soft crowd backdrop (no pause), swaps to his photo, then to the duo photo on "one person". */
const OpenDay: React.FC<{ frames: number }> = ({ frames }) => {
  const c = TL.open;
  // v8: a quick establishing cut (the real CODE Berlin building) before the crowd photo, and a brief CODE office
  // cutaway card at the exact moment the backdrop blurs, right before Santi's WIRED-stage clip takes over the card.
  const codeOut = c.card + fr(0.35) - 1; // v13: −1 f, snapped onto the 172 BPM grid (see mixtimes.ts TL comment)
  return (
    <AbsoluteFill>
      <Shots
        total={frames}
        dim={0.5}
        shots={[
          { f: 0, file: M("code_building_crop.jpg"), zoom: 1.12 },
          { f: fr(0.5) - 1, file: M("code_office.jpg"), zoom: 1.14 }, // v13: −1 f, snapped onto the 172 BPM grid
        ]}
      />
      <Sequence from={c.card} layout="none" name="crowd (soft)">
        <Backdrop file={M("code_building.jpg")} blur={18} tint="rgba(0,0,0,0.42)" punch />
      </Sequence>
      <CardShots
        left={20}
        top={35}
        width={58}
        aspect={4 / 5}
        total={frames}
        shots={[
          { f: c.card, file: M("code_office_card.jpg") },
          { f: codeOut, file: M("santi_clip_rt.mp4") },
          { f: c.face, file: M("santi_face.jpg") },
          { f: c.duo, file: M("duo.jpg") },
        ]}
      />
      <NameTag at={codeOut} x={470} y={1325} size={200} sub="co-founder" subX={360} subY={1440} arrow={[185, 1270, 95, 1130, 190, 1000]} />
      {/* small CODE brand mark (inverted to white, drop-shadowed). v8: moved from beside the (now much wider) caption to
          just below it — the two never share the frame with "I talked to" either way, since this mark is gone (durationInFrames
          = c.card) well before that line appears, so there's no three-way clash. */}
      <Sequence from={0} durationInFrames={c.card} layout="none" name="CODE logo mark">
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <Img
            src={staticFile(M("code_logo.png"))}
            style={{ position: "absolute", right: 60, top: 320, width: 160, filter: "invert(1) drop-shadow(0 2px 10px rgba(0,0,0,0.55))" }}
          />
        </AbsoluteFill>
      </Sequence>
      <Words
        color="#fff"
        shadow={WHITE_SHADOW}
        words={words([
          // v8: bolder + bigger against the busy WIRED-stage/crowd background. At the original tracking, this phrase was
          // already ~1103px wide at size 128 (centred, that's clipping off-screen at x:48%) — so a tighter tracking (-0.08em)
          // reclaims the width a real size increase (128 → 136) needs, a faux-bold white text-stroke + a heavier shadow stack
          // adds the "bolder", and re-centring on x:50 (was 48) plus y 10.5 → 11.3 keeps it inside the top 7% safe zone and
          // off both side edges (verified with a still, see report).
          // v14: whole stack moved down +3.5 (was 12.3/18.5/26/28) — the title's top edge sat above the 220px safe
          // line (Juan's reference); relative spacing between lines kept the same.
          { t: T.open[0], text: "at CODE's open day", font: "sans", size: 134, x: 49.5, y: 15.8, tracking: "-0.09em", stroke: "3px #fff", shadow: "0 2px 3px rgba(0,0,0,0.95), 0 8px 26px rgba(0,0,0,0.65), 0 0 50px rgba(0,0,0,0.55)" },
          { t: T.open[1], text: "I talked to", font: "serif", size: 96, x: 40, y: 22 },
          { t: T.open[2], text: "one", font: "sans", size: 195, x: 21, y: 29.5 },
          { t: T.open[2] + 0.2, text: "person", font: "script", size: 240, x: 65, y: 31.5, color: RED, weight: 700 },
        ])}
      />
    </AbsoluteFill>
  );
};

/** Grey avatar grid on crowd photos; one cell (Santiago) lights up with a ring, sparkles and a name tag. */
const COLS = 8,
  ROWS = 13,
  CELL = 1080 / COLS;
const HLC = { c: 3, r: 6 };
const Avatar: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={o * 0.92}>
      <circle cx={x} cy={y} r={48} fill="#eef0f3" />
      <circle cx={x} cy={y - 12} r={17} fill="#a9adb6" />
      <path d={`M ${x - 30} ${y + 34} Q ${x} ${y - 6} ${x + 30} ${y + 34}`} fill="#a9adb6" />
    </g>
  );
};
const Grid: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const hlAt = TL.grid.hl;
  const s = spring({ frame: Math.max(0, frame - hlAt), fps: FPS, config: { damping: 10, stiffness: 150 } });
  const hx = HLC.c * CELL + CELL / 2,
    hy = HLC.r * CELL + 140;
  const dim = interpolate(frame, [hlAt, hlAt + 8], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Shots
        mode="backdrop"
        total={frames}
        blur={5}
        tint="rgba(255,255,255,0.55)"
        shots={[
          { f: 0, file: M("code_office.jpg") }, // v8: real CODE office footage ties this beat back to the open day
          { f: fr(0.35) + 2, file: M("w14.jpg") }, // v13: +2 f, snapped onto the 172 BPM grid
          { f: TL.grid.b, file: M("w15.jpg") },
          { f: hlAt, file: M("santi.jpg") },
          { f: TL.grid.d, file: M("duo.jpg") },
        ]}
      />
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: dim }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS,
            r = Math.floor(i / COLS);
          return <Avatar key={i} x={c * CELL + CELL / 2} y={r * CELL + 140} delay={Math.floor(r * 0.8 + c * 0.4)} />;
        })}
      </svg>
      {frame >= hlAt ? (
        <>
          <div style={{ position: "absolute", left: hx - 190, top: hy - 190, width: 380, height: 380, borderRadius: "50%", overflow: "hidden", filter: "blur(58px) brightness(1.3) saturate(1.8)", opacity: 0.85 * s }}>
            <Media file={P.santi} label="" hue={120} />
          </div>
          <div style={{ position: "absolute", left: hx - 150, top: hy - 150, width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: "10px solid #fff", boxShadow: "0 0 0 4px #e5e5e5, 0 18px 40px rgba(0,0,0,0.25)", transform: `scale(${s})` }}>
            <Media file={P.santi} label="" hue={120} />
          </div>
          {[
            [-190, -150, 54],
            [175, -120, 40],
            [160, 165, 46],
          ].map(([dx, dy, sz], i) => (
            <svg key={i} width={sz} height={sz} viewBox="-10 -10 20 20" style={{ position: "absolute", left: hx + dx, top: hy + dy }}>
              <path d="M0 -10 Q1 -1 10 0 Q1 1 0 10 Q-1 1 -10 0 Q-1 -1 0 -10 Z" fill={INK} />
            </svg>
          ))}
        </>
      ) : null}
      <NameTag at={hlAt} x={500} y={1225} size={200} arrow={[205, 1290, 100, 1150, 300, 1010]} />
      <Words
        color={INK}
        words={words([
          // v14: +3.7 (was 11.5/19.5) — "now my" top edge sat above the 220px safe line.
          { t: T.hl - 0.1, text: "now my", font: "serif", size: 112, x: 25, y: 15.2 },
          { t: T.hl + 0.2, text: "co-founder", font: "script", size: 232, x: 50, y: 23.2, weight: 700, color: RED },
        ])}
      />
      <Sub text="out of everyone there" at={0} until={T.hl} />
    </AbsoluteFill>
  );
};

/** Dorm: four hard cuts, all full-bleed (3 clips, then a photo of the room), zoom-punch + flash on each cut. */
const Dorm: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Shots
      total={frames}
      shots={[
        { f: 0, file: M("dorm1.mp4"), bright: 1.08 },
        { f: TL.dorm.c1, file: M("dorm3.mp4"), bright: 1.08 },
        { f: TL.dorm.c2, file: M("dorm2.mp4"), bright: 1.2 },
        { f: TL.dorm.c3, file: M("w12.jpg"), zoom: 1.12 }, // v8: the beanbag shot (w11.jpg) replaced with the moodier solo desk/two-monitor photo
      ]}
    />
    <Cap
      items={[
        { t: T.dorm[0], text: "same dorm.", size: 150, shadow: "0 0 3px #000, 0 4px 12px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.85)" },
        { t: T.dorm[1], text: "late nights.", font: "script", size: 330, color: RED, shadow: "0 0 3px #000, 0 6px 14px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.9), 0 0 90px rgba(0,0,0,0.8)" },
        // v8: noticeably bigger (150 → 198) — Libre Caslon Display is a lighter weight than the Inter Tight "same dorm.", so it
        // needs the extra size to carry the same visual weight; re-checked against safe zones with a still (see report).
        { t: T.dorm[2], text: "pivot after pivot.", font: "serif", size: 198, shadow: "0 0 3px #000, 0 4px 12px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.85)" },
      ]}
    />
  </AbsoluteFill>
);

/** Stanford: plane window → podium photo (darkened so the red reads red), held for the rest of the beat with a slow
 *  push-in; v8: plane.mp4 only plays once (Juan's note) — the second cut back to the plane is replaced by a quick
 *  re-punch on the SAME photo at the old cut's timing (TL.stan.plane2), not a new or repeated clip. */
const Stanford: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Shots
      total={frames}
      dim={0.5}
      shots={[
        { f: 0, file: M("plane.mp4"), zoom: 1.1 },
        { f: TL.stan.photo, file: M("stanford.jpg"), zoom: 1.14, rePunchAt: TL.stan.plane2 - TL.stan.photo },
      ]}
    />
    <Words
      color="#fff"
      shadow={WHITE_SHADOW}
      words={words([
        // v14: main stack +3 (was 12/19.5/28.5), "summer 2026" set to 14.2 — all sat above the 220px safe line.
        { t: T.stan[0], text: "then", font: "serif", size: 104, x: 25, y: 15 },
        { t: T.stan[1], text: "Stanford", font: "sans", size: 236, x: 47, y: 22.5 },
        { t: T.stan[2], text: "changed everything", font: "script", size: 140, x: 47, y: 31.5, color: RED },
        { t: T.stan[2] + 0.35, text: "summer 2026", font: "serif", size: 76, x: 72, y: 14.2, rotate: -6 },
      ])}
    />
  </AbsoluteFill>
);

/** Calendar flip for "t-t-two weeks later": two stutter lifts (page lifts and snaps back, in sync with the voice
 *  stutter), then 13 accelerating flips from day 1 to day 14, landing with a bounce. Frames are relative to the beat. */
const Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  // v7: nothing lifts, flips, bounces or shakes. The number just hard-cuts on each flip frame (1 → 14), then turns red on 14.
  const day = Math.min(14, 1 + CAL.flips.filter((x) => frame >= x).length);
  return (
    <div style={{ position: "absolute", left: "22%", width: "56%", top: "30%", aspectRatio: "0.82", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#f3f4f6" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "22%", background: RED, borderRadius: "34px 34px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 64, letterSpacing: "0.2em", ...FONTS.sans }}>DAY</div>
      {[30, 70].map((x) => (
        <div key={x} style={{ position: "absolute", left: `${x}%`, top: -22, width: 26, height: 64, marginLeft: -13, borderRadius: 13, background: "#2b2b2e" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: "22%", bottom: 0, background: "#fff", borderRadius: "0 0 34px 34px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 330, lineHeight: 1, color: day === 14 ? RED : INK, ...FONTS.sans, fontVariantNumeric: "tabular-nums" }}>{day}</div>
        <div style={{ fontSize: 56, color: INK, marginTop: 6, ...FONTS.serif }}>{day === 14 ? "first device" : "day " + day}</div>
      </div>
    </div>
  );
};
/** "2 weeks" that stutters by hard cuts: "2" → "2 w" → "2 weeks" (no jitter, no ghost). */
const StutterTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const hits = [...CAL.stutter, 10];
  const k = hits.filter((h) => frame >= h).length;
  if (k === 0) return null;
  const text = k === 1 ? "2" : k === 2 ? "2 w" : "2 weeks";
  // v14: was top 8% / right 6% — sat well inside the top-220px / right-945px safe zone (Juan's reference). Moved
  // down and narrowed so the full "2 weeks" line clears both lines at this font size, with room before the calendar card.
  return <div style={{ position: "absolute", left: 0, right: "14%", top: "13%", textAlign: "center", fontSize: 215, lineHeight: 1, color: INK, ...FONTS.sans }}>{text}</div>;
};
const Build: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const b = TL.build;
  const i = frame >= b.pilot ? 2 : frame >= b.mount ? 1 : 0;
  const calOut = frame < b.device ? 1 : 0;
  return (
    <AbsoluteFill>
      <Shots
        mode="backdrop"
        total={frames}
        blur={5}
        tint="rgba(255,255,255,0.55)"
        shots={[
          { f: 0, file: M("dash.mp4") },
          { f: b.bg2, file: M("dash.mp4"), start: 2.2 },
        ]}
      />
      <StutterTitle />
      <Words color={INK} words={words([{ t: T.build.later, text: "later", font: "script", size: 175, x: 71, y: 23, color: RED, rotate: -4 }])} />
      {calOut > 0 ? (
        <AbsoluteFill>
          <Calendar />
        </AbsoluteFill>
      ) : null}
      {frame >= b.device ? (
        <>
          <CardShots left={20} top={34} width={60} aspect={4 / 5} total={b.pilot} tail={0} shots={[{ f: b.device, file: M("device.jpg") }, { f: b.mount, file: M("mount.jpg") }]} zoom={1.06} />
          <Sequence from={b.pilot} layout="none" name="pilot + road">
            <CardShots left={10} top={34} width={76} aspect={4 / 3} total={frames - b.pilot} shots={[{ f: 0, file: M("pilot.jpg") }, { f: b.car - b.pilot, file: M("mclaren_beach.mp4"), start: 1.0 }]} zoom={1.06} />
          </Sequence>
          <div style={{ position: "absolute", left: 0, right: "6%", top: "27%", textAlign: "center", fontSize: 100, color: i === 2 ? RED : INK, textShadow: "0 0 18px #fff, 0 0 6px #fff", ...FONTS.serif }}>{i === 0 ? "our first device" : i === 1 ? "on real cars" : "our first pilot"}</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Tech: waveform card with anomaly, big "4 weeks in advance", on four cutting backdrops. */
const Tech: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const alertAt = fr(T.tech[2]);
  return (
    <AbsoluteFill>
      <Shots
        mode="backdrop"
        total={frames}
        blur={5}
        tint="rgba(255,255,255,0.6)"
        shots={[
          { f: 0, file: M("dash.mp4"), start: 0.3 },
          { f: TL.tech.c1, file: M("w3.jpg") },
          { f: TL.tech.c2, file: M("bridge.mp4") },
          { f: TL.tech.c3, file: M("dash.mp4"), start: 2.4 },
        ]}
      />
      <Words
        color={INK}
        words={words([
          // v14: +3.75 (was 11.15/16/21.5) — "next-gen tech that" top edge sat above the 220px safe line.
          { t: 0.05, text: "next-gen tech that", font: "serif", size: 100, x: 47, y: 14.9 },
          { t: T.tech[1], text: "predicts", font: "sans", size: 124, x: 30, y: 19.75 },
          { t: T.tech[1] + 0.22, text: "vehicle issues", font: "script", size: 118, x: 55, y: 25.25, color: RED },
          { t: T.tech[3], text: "4 weeks", font: "sans", size: 215, x: 44, y: 64.5, color: RED },
          { t: T.tech[4], text: "in advance", font: "script", size: 190, x: 45, y: 73.5, weight: 700 },
        ])}
      />
      <div style={{ position: "absolute", left: "7%", width: "78%", top: "27%", height: "31%", background: "#fff", borderRadius: 34, boxShadow: "0 12px 40px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 40, top: 34, fontSize: 32, color: INK, opacity: 0.6, letterSpacing: "0.12em", ...FONTS.serif }}>MSU · LIVE · ACOUSTIC</div>
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 36, ...FONTS.sans }}>Brake pad wear</span>
            <span style={{ fontSize: 34, color: "#fff", ...FONTS.serif }}>~4 weeks to failure</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const Works: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const on = frame >= 4 ? 1 : 0; // v7: "works." + check badge + underline all appear on this one frame and stay still
  return (
    <AbsoluteFill>
      <Shots
        total={frames}
        dim={0.5}
        shots={[
          { f: 0, file: M("works.mp4"), zoom: 1.08 },
          { f: TL.works.cut, file: M("works.mp4"), start: 2.5, zoom: 1.1 },
        ]}
      />
      <div style={{ position: "absolute", left: 0, right: "12%", top: "24%", textAlign: "center", color: "#fff", textShadow: WHITE_SHADOW }}>
        <div style={{ fontSize: 190, lineHeight: 1.05, ...FONTS.script, transform: "rotate(-3deg)" }}>and it</div>
        <div style={{ fontSize: 255, lineHeight: 1.05, ...FONTS.sans, color: RED, visibility: on ? "visible" : "hidden" }}>works.</div>
        <div style={{ margin: "34px auto 0", width: 140, height: 140, borderRadius: 70, background: GREEN, visibility: on ? "visible" : "hidden" }}>
          <svg viewBox="0 0 140 140" width={140} height={140}>
            <path d="M38 72 L62 96 L103 46" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Swoosh at={4} x1={100} x2={845} y={880} shadow />
    </AbsoluteFill>
  );
};

/** Outro: FounderIntro's B9 with Juan's mic clip (cutting to two more photos/clips), on a soft backdrop of the same footage. */
const Outro: React.FC<{ frames: number }> = ({ frames }) => (
  <AbsoluteFill>
    <Backdrop file={M("outro.mp4")} blur={5} tint="rgba(255,255,255,0.55)" punch />
    <B9
      p={P}
      frames={frames}
      line2={T.outro[0]}
      last={T.outro[1]}
      bg="transparent"
      noFade
      card={<CardShots left={8} top={27} width={76} aspect={16 / 10} total={frames} zoom={1.1} shots={[{ f: 0, file: M("outro.mp4") }, { f: TL.outro.c1, file: M("w1.jpg") }, { f: TL.outro.c2, file: M("outro.mp4"), start: 3.2 }]} />}
    />
    <Words color={INK} words={words([{ t: T.outro[2], text: "follow along", font: "serif", size: 92, x: 42, y: 74, rotate: -3, color: RED }])} />
  </AbsoluteFill>
);

/** v7: beats enter by hard cut. The entrance zoom-punch + flash lives in the footage layers (Full/Backdrop), never on the text. */
const Enter: React.FC<{ i: number; children: React.ReactNode }> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;

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
    <OpenDay frames={F[3]} />,
    <Grid frames={F[4]} />,
    <Dorm frames={F[5]} />,
    <Stanford frames={F[6]} />,
    <Build frames={F[7]} />,
    <AbsoluteFill>
      <Backdrop file={M("dash.mp4")} start={1.2} blur={3} tint="rgba(255,255,255,0.3)" punch />
      <B6 p={P} brand={T.brand} swoosh bg="transparent" tile0={TL.wall.tile0} />
    </AbsoluteFill>,
    <Tech frames={F[9]} />,
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
      <SfxTrack cues={cuesFor(S)} volume={p.sfxVolume} />
      {/* hard cuts between beats; each incoming beat punches in on its footage (no fade from black or white) */}
      {beats.map((b, i) => (
        <Sequence key={i} from={S[i]} durationInFrames={F[i]} name={NAMES[i]}>
          <Enter i={i}>{b}</Enter>
        </Sequence>
      ))}
      {p.safeZones ? <SafeZones /> : null}
    </AbsoluteFill>
  );
};

/** Areas covered by TikTok / Instagram Reels UI (union of both apps): top bar, right action column, bottom caption.
 *  v14: tightened to Juan's measured reference (1080×1920 canvas) — top 220px, right column 100px + 35px gap (so the
 *  safe area's right edge sits at 945px), bottom 450px. Previously 7% / 15% / 20%, which was looser on top and bottom. */
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 220, background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", right: 0, width: 135, top: "45%", bottom: "20%", background: "rgba(255,0,0,0.28)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 450, background: "rgba(255,0,0,0.28)" }} />
  </AbsoluteFill>
);

export const mixDefaults: MP = mixSchema.parse({});
