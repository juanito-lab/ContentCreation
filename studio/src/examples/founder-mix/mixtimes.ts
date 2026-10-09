// Timing of the FounderMix reel (v6). Pure numbers (no React) so scripts can import it.
// Everything here comes from the voiceover plan: takes/assemble3.py (tempo 1.12, maxgap 0.12, tail 0.10, map line +0.5 s, SF line +0.3 s)
// → takes/plan_t5_v6.json; old (v5) times were mapped through the source take with takes/retime.py.
export const FPS = 30;
export const fr = (s: number) => Math.round(s * FPS);

/** Beat lengths = gaps between line starts of the VO plan, rounded to whole frames (so the beat starts never drift from the voice). Last beat holds 0.27 s after the voice ends. */
export const MIX_DURS = [2.267, 3.267, 1.5, 4.033, 2.9, 3.767, 2.433, 4.567, 2.0, 4.033, 1.467, 2.833];
/** In-beat cue times (s from beat start) of the spoken phrases. */
export const T = {
  hook: [0.205, 0.6, 1.053, 1.632],
  mapBerlin: 1.35,
  mapNext: 2.142,
  open: [0.123, 1.329, 2.942],
  hl: 1.362,
  dorm: [0.028, 1.07, 2.17],
  stan: [0.043, 0.787, 1.269],
  build: { later: 1.053, device: 1.826, mount: 2.597, pilot: 3.264 },
  brand: 1.36,
  tech: [0.042, 1.242, 2.332, 2.554, 3.181],
  outro: [1.038, 1.79, 2.417],
};

/** Frame a word pops in (Words: t − 0.1 s, so it lands just before the voice). */
export const pf = (t: number) => Math.max(0, fr(t - 0.1));
/** Frame of a hard cut on a phrase (a hair before the voice). */
export const cutF = (t: number) => Math.max(0, fr(t - 0.05));

/** Plane flights on the map (frames local to the map beat). `land` = the plane shrinks into the pin (animation end). */
export const MAP = (() => {
  const fly1: [number, number] = [fr(0.3), fr(T.mapBerlin)];
  const cam: [number, number] = [fr(T.mapBerlin + 0.3), fr(T.mapBerlin + 0.3) + 30];
  const fly2: [number, number] = [cam[0] + 4, cam[0] + 36];
  return { fly1, cam, fly2, land1: fly1[1] + 9, land2: fly2[1] + 9 };
})();

/** Calendar flip for "t-t-two weeks later" (frames relative to the build beat): two stutter lifts, 13 accelerating flips, bouncy landing. */
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

/** Hard cuts / shot swaps inside the beats (frames local to the beat).
 *  v13: no embedded music any more (Juan drops his own track — "Miss Alissa" by Eagles of Death
 *  Metal, 172 BPM — straight into TikTok/IG's own audio tool once he's posting, so we never touch
 *  or ship that file). Instead the cuts below are retimed to a 172 BPM grid so his later tempo-matched
 *  track lines up with the pacing: beat 0.34884 s, bar 1.39535 s, half-bar 0.69767 s, eighth
 *  0.17442 s, sixteenth 0.08721 s, grid zero = video frame 0 (global, not beat-local — Juan will pick
 *  his song's own start point to match, so frame 0 is as good an anchor as any and keeps the whole
 *  reel on one consistent grid). v13 snaps any cut within ±0.15 s of the nearest 172 BPM eighth-note
 *  line onto it (wider than v12's ±0.08 s 140 BPM pass, and this time nothing in range was left
 *  unsnapped). Only the raw cut-timing numbers below move; every T[...] value they're built from
 *  (which also drives word/caption pop timing via pf()) is untouched, so no caption shifts. */
export const TL = {
  hook: { moto: cutF(T.hook[2]) + 1, moto2: cutF(T.hook[3]) },
  sf: { bridge: fr(0.7) + 1 },
  open: { card: fr(1.2) - 1, face: fr(2.35) + 1, duo: cutF(T.open[2]) },
  grid: { b: fr(0.7) - 2, hl: fr(T.hl) - 1, d: fr(2.15) + 1 },
  dorm: { c1: cutF(T.dorm[1]), c2: cutF(T.dorm[2]) - 2, c3: fr(2.95) },
  stan: { photo: cutF(T.stan[1]) - 5, plane2: fr(1.75) + 1 },
  build: { bg2: fr(0.85) - 3, device: fr(T.build.device - 0.1) - 3, mount: fr(T.build.mount) + 2, pilot: fr(T.build.pilot) - 2, car: fr(3.95) + 3 },
  wall: { tile0: 0, step: 2, tiles: 17 },
  tech: { c1: cutF(T.tech[1]) - 1, c2: cutF(T.tech[2]) - 1, c3: cutF(T.tech[4]) - 1 },
  works: { cut: fr(0.75) - 4 },
  outro: { c1: cutF(T.outro[0]) - 3, c2: cutF(T.outro[1]) + 1 },
};
