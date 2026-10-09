// Sound cues of the FounderMix reel (v6). Every cue sits on a visual event of its beat (frame numbers come from mixtimes.ts, the same
// numbers the animations use) and sounds that carry on after their visual (whooshes, pen strokes, page flips, plane) are cut with `until`.
import type { Cue, SoundName } from "./sfx";
import { CAL, MAP, T, TL, fr, pf } from "./mixtimes";

/** Cue plus the visual event it belongs to (for the cue table: tools/cuetable). */
export type TCue = Cue & { ev: string; evAt: number };

/** "Whoosh Passenger Plane": loudest 50 ms −12.3 dB. vol 0.055 (x1.5 sfxVolume) puts its loudest 400 ms ~11 dB under the median speech level of the voice track (measured, see report). */
export const PLANE_VOL = 0.055;

export const cuesFor = (S: number[]): TCue[] => {
  const c: TCue[] = [];
  /** at = hit frame (absolute), ev = visual event, evAt = frame of the visual event (defaults to the hit) */
  const add = (s: SoundName, at: number, vol: number, name: string, o: { until?: number; skip?: number; ev?: string; evAt?: number } = {}) =>
    c.push({ at, s, vol, name, until: o.until, skip: o.skip, ev: o.ev ?? name, evAt: o.evAt ?? at });
  const B = (i: number, f: number) => S[i] + f;
  /** v7: text is static, so a text cue is one subtle click on the frame the text appears, cut right after the click */
  const tclick = (name: string, at: number, vol = 0.5) => add("pen_click", at, vol, name, { until: at + 3, ev: "text appears (hard cut)" });

  // ---------------------------------------------------------------- 1 Hook
  add("key1", B(0, pf(T.hook[0])), 0.07, "I left", { until: B(0, pf(T.hook[0]) + 4), ev: "text appears (hard cut)" });
  add("key2", B(0, pf(T.hook[1])), 0.07, "Zürich", { until: B(0, pf(T.hook[1]) + 4), ev: "text appears (hard cut)" });
  add("key3", B(0, pf(T.hook[2])), 0.07, "to chase my", { until: B(0, pf(T.hook[2]) + 4), ev: "text appears (hard cut)" });
  add("whoosh_rope", B(0, TL.hook.moto), 0.1, "hook → moto cut", { until: B(0, TL.hook.moto + 8), ev: "hard cut + zoom-punch (settles in 6 f)" });
  tclick("dream", B(0, pf(T.hook[3])));
  add("whooshShort", B(0, TL.hook.moto2), 0.03, "hook cut 3", { ev: "hard cut + zoom-punch" });

  // ---------------------------------------------------------------- 2 Map: Zürich → Berlin → SF
  add("road_map_unfold", B(1, 4), 0.17, "map arrives", { until: B(1, 18), ev: "map zooms in (beat entrance 0–7 f)" });
  // plane: the file's peak (closest point, 1837 ms) lands on the arrival of each flight; it starts mid-file so the run-up is as long as the flight
  const planeSkip = Math.round(1837 - ((MAP.fly1[1] - MAP.fly1[0]) / 30) * 1000);
  add("plane_whoosh", B(1, MAP.fly1[1]), PLANE_VOL, "plane Zürich → Berlin", { skip: planeSkip, until: B(1, MAP.land1 + 1), ev: "plane arrives at Berlin / shrinks into the pin (ends at land)", evAt: B(1, MAP.fly1[1]) });
  add("cardPlace1", B(1, MAP.fly1[1]), 0.06, "Berlin pin", { until: B(1, MAP.fly1[1] + 12), ev: "pin springs in" });
  add("plane_whoosh", B(1, MAP.fly2[1]), PLANE_VOL, "plane Berlin → SF", { skip: planeSkip, until: B(1, MAP.land2 + 1), ev: "plane arrives at SF / shrinks into the pin (ends at land)", evAt: B(1, MAP.fly2[1]) });
  add("cardPlace1", B(1, MAP.fly2[1]), 0.06, "SF pin", { until: B(1, MAP.fly2[1] + 12), ev: "pin springs in" });

  // ---------------------------------------------------------------- 3 SF
  add("swishSmall", B(2, 0), 0.035, "cut 3 (whoosh)", { until: B(2, 9), ev: "beat entrance" });
  add("whooshShort", B(2, TL.sf.bridge), 0.03, "SF → bay-view cut", { ev: "hard cut + zoom-punch" });

  // ---------------------------------------------------------------- 4 Open day
  tclick("open day", B(3, pf(T.open[0])));
  tclick("I talked to", B(3, pf(T.open[1])));
  add("cardPlace1", B(3, TL.open.card), 0.08, "Santi clip card lands", { until: B(3, TL.open.card + 12), ev: "card pops in (spring) with the clip" });
  tclick("Santiago tag", B(3, TL.open.card), 0.35);
  add("shutter3", B(3, TL.open.face), 0.05, "card → Santi photo", { ev: "shot swap + flash" });
  add("shutterInsta2", B(3, TL.open.duo), 0.085, "card → duo photo", { ev: "shot swap + flash" });
  tclick("person", B(3, pf(T.open[2] + 0.2)));

  // ---------------------------------------------------------------- 5 Grid
  add("riffle1", B(4, 0), 0.08, "avatars deal in", { until: B(4, 16), ev: "avatars fade in row by row (0–14 f)" });
  add("whooshShort", B(4, TL.grid.b), 0.03, "grid backdrop cut", { ev: "hard cut + flash" });
  add("shutterDslr", B(4, TL.grid.hl), 0.12, "Santi lights up", { ev: "ring pops + backdrop cut" });
  tclick("co-founder", B(4, pf(T.hl + 0.2)));
  add("whooshShort", B(4, TL.grid.d), 0.03, "grid backdrop cut 2", { ev: "hard cut + flash" });

  // ---------------------------------------------------------------- 6 Dorm
  add("swish", B(5, 0), 0.03, "cut 6 (whoosh)", { until: B(5, 10), ev: "beat entrance" });
  add("key1", B(5, Math.max(0, fr(T.dorm[0] - 0.05))), 0.07, "same dorm", { until: B(5, Math.max(0, fr(T.dorm[0] - 0.05)) + 4), ev: "text appears (hard cut)" });
  add("whoosh_rope", B(5, TL.dorm.c1), 0.1, "dorm cut 1", { until: B(5, TL.dorm.c1 + 8), ev: "hard cut + zoom-punch" });
  add("key2", B(5, fr(T.dorm[1] - 0.05)), 0.07, "late nights", { until: B(5, Math.max(0, fr(T.dorm[1] - 0.05)) + 4), ev: "text appears (hard cut)" });
  add("whoosh_rope", B(5, TL.dorm.c2), 0.1, "dorm cut 2", { until: B(5, TL.dorm.c2 + 8), ev: "hard cut + zoom-punch" });
  add("key3", B(5, fr(T.dorm[2] - 0.05)), 0.07, "pivot after pivot", { until: B(5, Math.max(0, fr(T.dorm[2] - 0.05)) + 4), ev: "text appears (hard cut)" });
  add("whooshShort", B(5, TL.dorm.c3), 0.03, "dorm cut 3", { ev: "hard cut + zoom-punch" });

  // ---------------------------------------------------------------- 7 Stanford
  add("swishSmall", B(6, 0), 0.035, "cut 7 (whoosh)", { until: B(6, 9), ev: "beat entrance" });
  tclick("then", B(6, pf(T.stan[0])));
  add("camera_shutter_nikon", B(6, TL.stan.photo), 0.16, "Stanford photo", { ev: "cut to the photo + flash" });
  tclick("Stanford", B(6, pf(T.stan[1])));
  tclick("changed everything", B(6, pf(T.stan[2])));
  tclick("summer 2026", B(6, pf(T.stan[2] + 0.35)), 0.35);
  add("whooshShort", B(6, TL.stan.plane2), 0.03, "Stanford → plane cut", { ev: "hard cut + zoom-punch" });

  // ---------------------------------------------------------------- 8 Build: calendar → three photos
  add("whooshShort", B(7, 0), 0.035, "cut 8 (whoosh)", { until: B(7, 6), ev: "beat entrance" });
  // "2" / "2 w" / "2 weeks" hard-cut in on the three stutter frames
  [...CAL.stutter, 10].forEach((f, k) => tclick(`2 weeks stutter ${k + 1}`, B(7, f), 0.4));
  // loud part of the file (0.6–1.7 s) lines up with flips 1–13 (frames 11–40) and ends at the landing
  add("pages_flip_multi", B(7, CAL.flips[0] + 4), 0.13, "calendar fast flips", { skip: 500, until: B(7, CAL.land), ev: "13 digit cuts (11–40 f), ends at the landing" });
  add("cardPlace1", B(7, CAL.land), 0.08, "calendar lands (thud)", { until: B(7, CAL.land + 8), ev: "14 appears in red (hard cut)" });
  add("whooshShort", B(7, TL.build.bg2), 0.03, "build backdrop cut", { ev: "hard cut + flash" });
  add("shutterSlr2", B(7, TL.build.device), 0.09, "photo 1 · device", { ev: "card pops in" });
  add("shutter3", B(7, TL.build.mount), 0.09, "photo 2 · mount", { ev: "shot swap + flash" });
  add("shutterInsta1", B(7, TL.build.pilot), 0.09, "photo 3 · pilot", { ev: "shot swap + flash" });
  add("shutter2", B(7, TL.build.car), 0.07, "photo 4 · road test", { ev: "shot swap + flash" });

  // ---------------------------------------------------------------- 9 MantAI (climax)
  for (let k = 0; k < TL.wall.tiles; k += 2) add((["shutter3", "shutterInsta1", "shutterDslr"] as SoundName[])[(k / 2) % 3], B(8, TL.wall.tile0 + k * TL.wall.step), 0.034 + 0.002 * k, `wall tile ${k + 1}`, { ev: "tile lands" });
  const brand = fr(T.brand);
  add("riser1", B(8, brand - fr(0.64)), 0.05, "riser", { until: B(8, brand), ev: "wall builds, ends on the MANTAI hit" });
  add("tom1", B(8, brand), 0.14, "MANTAI", { ev: "MANTAI slams in + camera shake" });

  // ---------------------------------------------------------------- 10 Tech
  add("whooshShort", B(9, 0), 0.035, "cut 10 (whoosh)", { until: B(9, 6), ev: "beat entrance" });
  add("switch2", B(9, 2), 0.08, "sensor on", { ev: "card appears" });
  add("mouse2", B(9, TL.tech.c1), 0.06, "predicts (click)", { ev: "text appears + backdrop cut" });
  add("whooshShort", B(9, TL.tech.c2), 0.03, "tech backdrop cut 2", { ev: "hard cut + flash" });
  add("clink1", B(9, fr(T.tech[2])), 0.05, "alert", { ev: "alert card pops, bars turn red" });
  add("tom1", B(9, pf(T.tech[3])), 0.06, "4 weeks", { ev: "text appears (hard cut)" });
  add("whooshShort", B(9, TL.tech.c3), 0.03, "tech backdrop cut 3", { ev: "hard cut + flash" });
  tclick("in advance", B(9, pf(T.tech[4])));

  // ---------------------------------------------------------------- 11 It works
  add("swish", B(10, 0), 0.03, "cut 11 (whoosh)", { until: B(10, 10), ev: "beat entrance" });
  add("tom1", B(10, 4), 0.1, "works. (hit)", { ev: "'works.' appears (hard cut, 4 f)" });
  add("clink1", B(10, 5), 0.06, "check ✓", { ev: "check badge appears (4 f)" });
  add("whooshShort", B(10, TL.works.cut), 0.03, "works → photo cut", { ev: "hard cut + zoom-punch" });

  // ---------------------------------------------------------------- 12 Outro
  add("swishSmall", B(11, 0), 0.035, "cut 12 (whoosh)", { until: B(11, 9), ev: "beat entrance" });
  add("camera_shutter_nikon", B(11, 1), 0.16, "outro card (Nikon)", { ev: "card pops in" });
  add("shutter3", B(11, TL.outro.c1), 0.05, "outro photo swap", { ev: "shot swap + flash" });
  tclick("beginning", B(11, pf(T.outro[1])));
  add("whooshShort", B(11, TL.outro.c2), 0.03, "outro cut", { ev: "hard cut + zoom-punch" });
  tclick("follow along", B(11, pf(T.outro[2])));
  return c;
};
