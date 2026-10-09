// Demo (9 s, 9:16): three short scenes timed to word times. The same building blocks as a real short video, without real content.
// Every time comes from ./timing.ts (word times). There are no hard-coded times here: picture and sound hang off the same constants.
// This is the hand-coded reference from Jasper Kallfelz's shortform-edit-kit; new videos use the spec-driven `Short` composition instead.
//
//  1  "this is your hook, hello"            white card + inset clip (slow zoom), three text lines, the script word overlaps the inset a little
//  2  "look at these numbers"               green number that keeps rising until the cut, with a split-flap counter sound
//  3  "I'm Your Name, thanks for watching"  name above a second inset, squiggle arrow from the name into the clip, a text line below
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FONTS } from "../../lib/fonts";
import { Word, Words } from "../../lib/words";
import { Cue, SfxTrack, SOUNDS } from "../../lib/sfx";
import { VO } from "./timing";

/** Milliseconds in the voiceover → frames (30 fps). */
export const f = (ms: number) => Math.round(ms * 0.03);

/** Voiceover word times in ms, from ./timing.ts. */
const w = VO.w;
/** Scene boundaries in ms. Scene i runs from CUTS[i] to CUTS[i+1]. */
const CUTS = [0, w.look, w.im, VO.endMs];
const start = (i: number) => f(CUTS[i]);
const len = (i: number) => f(CUTS[i + 1]) - f(CUTS[i]);
export const DEMO_FRAMES = f(CUTS[3]);

const slotSchema = z.object({ label: z.string(), clip: z.string(), startSec: z.number().min(0) });

export const demoSchema = z.object({
  /** Audio file under public/ (empty = none). The cuts belong to the word times in ./timing.ts, so a different recording needs a new timing.ts. */
  voiceover: z.string(),
  voVolume: z.number().min(0).max(1),
  /** Music file under public/ (empty = none). */
  music: z.string(),
  musicVolume: z.number().min(0).max(1),
  /** Volume of all sound effects together (0 = off, 1 = the values in SFX_CUES). At 1.3 the effects are about as loud as music at 0.15. */
  sfxVolume: z.number().min(0).max(2),
  /** The value the green number reaches exactly on the cut to scene 3. It keeps rising until then. */
  counterTo: z.number().min(0),
  /** The two insets (scenes 1 and 3). clip = file name under public/ (e.g. "clip.mp4"); empty = grey placeholder. */
  slots: z.array(slotSchema),
});
export type DemoProps = z.infer<typeof demoSchema>;
type Slot = z.infer<typeof slotSchema>;

export const demoDefaults: DemoProps = {
  voiceover: "",
  voVolume: 1,
  music: "",
  musicVolume: 0.15,
  sfxVolume: 1.3,
  counterTo: 1000000,
  slots: [
    { label: "your clip", clip: "", startSec: 0 },
    { label: "your clip", clip: "", startSec: 0 },
  ],
};

// ------------------------------------------------------------ building blocks
const NONE: Slot = { label: "", clip: "", startSec: 0 };

/** A video, or a grey placeholder with a label. */
const Media: React.FC<{ slot: Slot; hue: number }> = ({ slot, hue }) =>
  slot.clip ? (
    <OffthreadVideo src={staticFile(slot.clip)} muted trimBefore={Math.round(slot.startSec * 30)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 15% 86%), hsl(${hue} 18% 74%))`,
        justifyContent: "center",
        alignItems: "center",
        color: "rgba(0,0,0,0.35)",
        fontSize: 34,
        letterSpacing: "0.18em",
        textAlign: "center",
        padding: 40,
        lineHeight: 1.5,
        ...FONTS.sansLight,
      }}
    >
      {slot.label}
    </AbsoluteFill>
  );

/** Inset width in % of the frame width (16:9, so height = width · 9/16). */
const INSET_WIDTH = 86;

/** Rounded 16:9 inset on a white card. */
const Inset: React.FC<{ slot: Slot; hue: number; top?: number; radius?: number; zoom?: { to: number; origin: string; frames: number } }> = ({ slot, hue, top = 37, radius = 28, zoom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  // zoom: the clip grows evenly to `to` over `frames` frames, around the point `origin` (in % of the clip)
  const z = zoom ? interpolate(frame, [0, zoom.frames], [1, zoom.to], { extrapolateRight: "clamp" }) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: `${(100 - INSET_WIDTH) / 2}%`,
        top: `${top}%`,
        width: `${INSET_WIDTH}%`,
        aspectRatio: "16 / 9",
        transform: `scale(${interpolate(sp, [0, 1], [0.92, 1])})`,
        opacity: interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" }),
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        borderRadius: radius,
        overflow: "hidden",
        background: "#dfe3ea",
      }}
    >
      {zoom ? (
        <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: zoom.origin }}>
          <Media slot={slot} hue={hue} />
        </AbsoluteFill>
      ) : (
        <Media slot={slot} hue={hue} />
      )}
    </div>
  );
};

/** Every word pops in 100 ms (3 frames) before it is spoken. That is how long the pop-in takes, so the word is fully
 *  there when it starts instead of 1–3 frames later. When a scene starts exactly on the word ("look at", "I'm"), the
 *  offset becomes negative and the text is already fully there on the scene's first frame. */
const TEXT_LEAD_MS = 100;

/** Words with an absolute voiceover time in ms → frames relative to the scene. */
const rel = (sceneIdx: number, ws: (Omit<Word, "at"> & { ms: number })[]): Word[] => ws.map(({ ms, ...w }) => ({ ...w, at: f(ms - TEXT_LEAD_MS) - start(sceneIdx) }));

const RED = "#E10600";
const GREEN = "#12b76a";
const GREEN_DARK = "#0a8f50";

// ------------------------------------------------------------ scenes
const S1: React.FC<{ slot: Slot }> = ({ slot }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Inset slot={slot} hue={210} top={44} zoom={{ to: 1.12, origin: "50% 50%", frames: len(0) }} />
    <Words
      color="#000"
      words={rel(0, [
        { ms: w.thisIs, text: "this is", font: "sansLight", size: 76, x: 28, y: 11 },
        { ms: w.yourHook, text: "your hook", font: "sans", size: 176, x: 50, y: 17.5 },
        // the script word spans the frame from edge to edge and overlaps the top of the inset a little
        { ms: w.hello, text: "hello", font: "script", size: 520, x: 48.5, y: 38.5, weight: 700, color: RED },
      ])}
    />
  </AbsoluteFill>
);

/** Frame (within the scene) where the number starts counting: exactly on the word "numbers". */
const COUNT_AT = f(w.numbers) - start(1);

/** Green number that keeps rising (accelerating) until the cut and never lands on a round value. */
const Counter: React.FC<{ counterTo: number }> = ({ counterTo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - COUNT_AT;
  if (local < 0) return null;
  const count = counterTo * Math.pow(Math.min(1, local / (len(1) - COUNT_AT)), 2.3);
  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 170, mass: 0.8 } });
  const arrowBob = Math.sin(local / 4) * 7;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`, opacity: interpolate(local, [0, 4], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ color: GREEN, fontSize: 168, lineHeight: 1, ...FONTS.sans, fontWeight: 900, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", textShadow: "0 6px 30px rgba(18,183,106,0.28)" }}>{Math.round(count).toLocaleString("en-US")}</div>
      <div style={{ color: GREEN, fontSize: 90, lineHeight: 1, transform: `translateY(${-arrowBob}px)` }}>▲</div>
    </div>
  );
};

const S2: React.FC<{ counterTo: number }> = ({ counterTo }) => (
  <AbsoluteFill style={{ background: "#fff" }}>
    <Counter counterTo={counterTo} />
    <Words
      color="#000"
      words={rel(1, [
        { ms: w.look, text: "look at these", font: "sansLight", size: 84, x: 50, y: 31 },
        { ms: w.numbers, text: "views", font: "serifItalic", size: 130, x: 50, y: 60, color: GREEN_DARK },
      ])}
    />
  </AbsoluteFill>
);

/** Position of the name and the inset in scene 3 (% of the height). The arrow's start and tip follow from these. */
const NAME_Y = 22;
const INSET3_TOP = 38;
/** Centre of the inset in pixels (1080 × 1920): where the arrow points. */
const INSET_MID_Y = (INSET3_TOP / 100) * 1920 + (1080 * (INSET_WIDTH / 100) * 9) / 16 / 2;

/** Hand-drawn squiggle arrow from the name into the centre of the inset: a line with a loop that draws itself from SQUIGGLE_AT
 *  over SQUIGGLE_FRAMES frames, then the two strokes of the arrow head. The start (SX, SY) sits under the end of the name, the tip
 *  (EX, EY) in the centre of the inset. The curve is built relative to start and tip, so moving either point still lands the arrow
 *  there. Coordinates in pixels. */
const SX = 880;
const SY = (NAME_Y / 100) * 1920 + 110;
const EX = 650;
const EY = INSET_MID_Y;
const SQUIGGLE = `M ${SX} ${SY} C ${SX + 85} ${SY + 2} ${SX + 129} ${SY + 60} ${SX + 97} ${SY + 116} C ${SX + 71} ${SY + 162} ${SX + 1} ${SY + 156} ${SX + 1} ${SY + 111} C ${SX + 1} ${SY + 66} ${SX + 71} ${SY + 62} ${SX + 85} ${SY + 128} C ${SX + 99} ${SY + 198} ${EX + 182} ${EY} ${EX} ${EY}`;
const SQUIGGLE_HEAD = [`M ${EX} ${EY} L ${EX + 34} ${EY - 21}`, `M ${EX} ${EY} L ${EX + 30} ${EY + 25}`];
const SQUIGGLE_AT = f(w.yourName + 60) - start(2);
const SQUIGGLE_FRAMES = 12;
const Squiggle: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SQUIGGLE_AT) return null;
  const line = interpolate(frame, [SQUIGGLE_AT, SQUIGGLE_AT + SQUIGGLE_FRAMES], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const head = interpolate(frame, [SQUIGGLE_AT + SQUIGGLE_FRAMES, SQUIGGLE_AT + SQUIGGLE_FRAMES + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // pathLength 1 + dash array 1: strokeDashoffset 1 = nothing drawn, 0 = the whole line
  const pen = { fill: "none", stroke: RED, strokeWidth: 9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1 };
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <path d={SQUIGGLE} {...pen} strokeDashoffset={1 - line} />
      {head > 0 ? SQUIGGLE_HEAD.map((d) => <path key={d} d={d} {...pen} strokeDashoffset={1 - head} />) : null}
    </svg>
  );
};

/** Outro: "I'm" + name on top, the inset with a slight zoom below, the squiggle arrow from the name into the clip, a text line under the inset. */
const S3: React.FC<{ slot: Slot }> = ({ slot }) => {
  const frame = useCurrentFrame();
  const frames = len(2);
  const fade = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <AbsoluteFill style={{ opacity: fade }}>
        <Inset slot={slot} hue={210} top={INSET3_TOP} zoom={{ to: 1.12, origin: "50% 50%", frames }} />
        <Words
          color="#000"
          words={rel(2, [
            { ms: w.im, text: "I'm", font: "sansLight", size: 84, x: 22, y: NAME_Y - 7.5 },
            { ms: w.yourName, text: "Your Name", font: "sans", size: 160, x: 52, y: NAME_Y },
            { ms: w.thanks, text: "thanks for watching", font: "sansLight", size: 84, x: 50, y: 75 },
          ])}
        />
        <Squiggle />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ composition
/** Sound effects. at = the video frame the sound sits on (for whooshes, the loudest point); vol = volume 0–1.
 *  The frames hang off the same word times and animation values as the picture, so they move with a new timing.ts.
 *  Levels: the vol values set the balance between sounds (drum and page louder, keys and flaps quiet).
 *  sfxVolume sets how loud they all are together. The file catalogue is in lib/sfx.tsx. */
/** One split-flap board flap at three slightly different pitches; FLAP_ORDER mixes them so no pattern is audible. */
const FLAPS = ["flapLo", "flap", "flapHi"] as const;
const FLAP_ORDER = [1, 0, 2, 0, 1, 2, 0];
const COUNT_TICKS = Math.floor((f(CUTS[2]) - 2 - f(w.numbers)) / 3) + 1;
/** Frame a word pops in on (TEXT_LEAD_MS before the spoken word). */
const pop = (ms: number) => Math.max(0, f(ms - TEXT_LEAD_MS));
/** The riser must end exactly on the cut into scene 3: its end lies (len − lead) after the point that sits on `at`. */
const RISER_AT = f(CUTS[2] - (SOUNDS.riser1.len - SOUNDS.riser1.lead));
const SFX_CUES: Cue[] = [
  // Scene 1: shutter when the clip pops in; a quiet key tap per text line; a pencil stroke on the script word
  { at: start(0), s: "shutterSlr3", vol: 0.085, name: "hook clip (shutter)" },
  { at: pop(w.thisIs), s: "key1", vol: 0.07, name: "this is (key)" },
  { at: pop(w.yourHook), s: "key2", vol: 0.075, name: "your hook (key)" },
  { at: pop(w.hello), s: "pencil1", vol: 0.04, name: "hello (pencil)" },
  // Scene 2: a page turn on the cut; one split-flap tick every 3 frames, getting louder until the cut;
  // a reversed cymbal swells and ends exactly on the cut
  { at: start(1), s: "page1", vol: 0.12, name: "cut to number (page turn)" },
  ...Array.from({ length: COUNT_TICKS }, (_, i): Cue => {
    const p = i / Math.max(1, COUNT_TICKS - 1);
    return { at: f(w.numbers) + i * 3, s: FLAPS[FLAP_ORDER[i % FLAP_ORDER.length]], vol: 0.02 + 0.03 * p, name: `counter ${i + 1}` };
  }),
  { at: RISER_AT, s: "riser1", vol: 0.06, name: "riser into the cut" },
  // Scene 3: drum on the first frame, shutter when the clip pops in, pencil while the squiggle draws, a key tap on the text line
  { at: start(2), s: "tom1", vol: 0.13, name: "cut to outro (drum)" },
  { at: start(2), s: "shutterInsta2", vol: 0.085, name: "outro clip (shutter)" },
  { at: start(2) + SQUIGGLE_AT, s: "pencil1", vol: 0.042, name: "squiggle arrow (pencil)" },
  { at: pop(w.thanks), s: "key3", vol: 0.075, name: "thanks for watching (key)" },
];

/** Music gain per frame: fades out over the last 18 frames. */
const musicGain = (frame: number) => interpolate(frame, [DEMO_FRAMES - 18, DEMO_FRAMES], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Demo: React.FC<DemoProps> = ({ slots, voiceover, voVolume, music, musicVolume, sfxVolume, counterTo }) => {
  const S = (i: number) => slots[i] ?? NONE;
  const scene = (i: number, name: string, node: React.ReactNode) => (
    <Sequence key={i} from={start(i)} durationInFrames={len(i)} name={name}>
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {voiceover ? <Audio src={staticFile(voiceover)} volume={voVolume} /> : null}
      {music ? <Audio src={staticFile(music)} volume={(fr) => musicVolume * musicGain(fr)} /> : null}
      <SfxTrack cues={SFX_CUES} volume={sfxVolume} />
      {scene(0, "1 · Hook", <S1 slot={S(0)} />)}
      {scene(1, "2 · Number", <S2 counterTo={counterTo} />)}
      {scene(2, "3 · Outro", <S3 slot={S(1)} />)}
    </AbsoluteFill>
  );
};
