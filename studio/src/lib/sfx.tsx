// Sound effects: the catalogue of files under public/sfx and a track that plays a list of cues.
// The files are prepared: leading silence trimmed (the hit sits at 0 ms), normalised to -1 dBFS, 48 kHz.
// Sources and licences of every file: public/sfx/CREDITS.md.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/** Only real recorded sounds, nothing synthetic (no ticks, pops or blips).
 *  len = length in ms. lead = ms from the start of the file to the point that should sit on the picture:
 *  0 = the hit (clicks, shutters, flaps); for whooshes and paper, the loudest point.
 *  loud = loudest 50 ms slice in dB. To swap two sounds at equal loudness: vol_new = vol_old * 10^((loud_old - loud_new) / 20). */
export const SOUNDS = {
  // camera shutters and film winders
  shutter2: { file: "sfx/shutter2.wav", len: 358, lead: 0, loud: -16.9 },
  shutter3: { file: "sfx/shutter3.wav", len: 194, lead: 0, loud: -19.3 },
  shutterSlr2: { file: "sfx/shutterSlr2.wav", len: 369, lead: 0, loud: -17.4 },
  shutterSlr3: { file: "sfx/shutterSlr3.wav", len: 687, lead: 0, loud: -16.7 },
  shutterInsta1: { file: "sfx/shutterInsta1.wav", len: 296, lead: 0, loud: -21.2 },
  shutterInsta2: { file: "sfx/shutterInsta2.wav", len: 290, lead: 0, loud: -18.7 },
  shutterOld: { file: "sfx/shutterOld.wav", len: 2113, lead: 0, loud: -19.1 },
  shutterDslr: { file: "sfx/shutterDslr.wav", len: 272, lead: 0, loud: -22.0 },
  shutterBurst2: { file: "sfx/shutterBurst2.wav", len: 943, lead: 0, loud: -23.6 },
  shutterBurst3: { file: "sfx/shutterBurst3.wav", len: 1528, lead: 0, loud: -23.2 },
  shutterBurst4: { file: "sfx/shutterBurst4.wav", len: 1823, lead: 0, loud: -23.2 },
  winder1: { file: "sfx/winder1.wav", len: 704, lead: 0, loud: -20.5 },
  winder2: { file: "sfx/winder2.wav", len: 580, lead: 0, loud: -22.5 },
  // mouse, trackpad, switches, ballpoint pen
  mouse1: { file: "sfx/mouse1.wav", len: 156, lead: 0, loud: -22.8 },
  mouse2: { file: "sfx/mouse2.wav", len: 225, lead: 0, loud: -24.5 },
  mouse3: { file: "sfx/mouse3.wav", len: 192, lead: 0, loud: -23.0 },
  mouse4: { file: "sfx/mouse4.wav", len: 56, lead: 0, loud: -20.8 },
  trackpad1: { file: "sfx/trackpad1.wav", len: 199, lead: 0, loud: -19.1 },
  trackpad2: { file: "sfx/trackpad2.wav", len: 207, lead: 0, loud: -24.2 },
  switch: { file: "sfx/switch.wav", len: 384, lead: 0, loud: -14.5 },
  switch2: { file: "sfx/switch2.wav", len: 235, lead: 0, loud: -19.0 },
  switch3: { file: "sfx/switch3.wav", len: 2184, lead: 0, loud: -20.0 },
  pen1: { file: "sfx/pen1.wav", len: 353, lead: 0, loud: -26.6 },
  pen2: { file: "sfx/pen2.wav", len: 216, lead: 0, loud: -25.3 },
  pen3: { file: "sfx/pen3.wav", len: 242, lead: 0, loud: -28.6 },
  // split-flap board like at an airport (flapLo/flapHi = flap pitched slightly lower/higher, against audible repetition)
  flap: { file: "sfx/flap.wav", len: 112, lead: 0, loud: -14.4 },
  flapLo: { file: "sfx/flapLo.wav", len: 119, lead: 0, loud: -14.1 },
  flapHi: { file: "sfx/flapHi.wav", len: 106, lead: 0, loud: -14.6 },
  flapBurst3: { file: "sfx/flapBurst3.wav", len: 410, lead: 0, loud: -11.4 },
  flapBurst5: { file: "sfx/flapBurst5.wav", len: 500, lead: 0, loud: -11.5 },
  flapBurst8: { file: "sfx/flapBurst8.wav", len: 791, lead: 0, loud: -11.0 },
  flapEnd1: { file: "sfx/flapEnd1.wav", len: 1750, lead: 0, loud: -14.3 },
  flapEnd2: { file: "sfx/flapEnd2.wav", len: 1450, lead: 0, loud: -15.9 },
  flapRun: { file: "sfx/flapRun.wav", len: 4559, lead: 0, loud: -20.9 },
  // paper
  page1: { file: "sfx/page1.wav", len: 512, lead: 183, loud: -19.5 },
  page2: { file: "sfx/page2.wav", len: 1643, lead: 722, loud: -20.3 },
  page3: { file: "sfx/page3.wav", len: 882, lead: 396, loud: -19.4 },
  tear: { file: "sfx/tear.wav", len: 841, lead: 446, loud: -18.5 },
  // whooshes (use sparingly)
  swish: { file: "sfx/swish.wav", len: 355, lead: 121, loud: -13.7 },
  whooshShort: { file: "sfx/whooshShort.wav", len: 135, lead: 60, loud: -11.7 },
  // riser (reversed cymbal), drum, cards, keys, pencil, glass
  riser1: { file: "sfx/riser1.wav", len: 1500, lead: 858, loud: -9.5 },
  tom1: { file: "sfx/tom1.wav", len: 931, lead: 0, loud: -11.7 },
  riffle1: { file: "sfx/riffle1.wav", len: 596, lead: 0, loud: -21.4 },
  key1: { file: "sfx/key1.wav", len: 340, lead: 0, loud: -21.9 },
  key2: { file: "sfx/key2.wav", len: 315, lead: 0, loud: -22.7 },
  key3: { file: "sfx/key3.wav", len: 172, lead: 0, loud: -22.2 },
  pencil1: { file: "sfx/pencil1.wav", len: 630, lead: 0, loud: -11.5 },
  pencil2: { file: "sfx/pencil2.wav", len: 530, lead: 0, loud: -12.5 },
  cardPlace1: { file: "sfx/cardPlace1.wav", len: 767, lead: 170, loud: -21.7 },
  clink1: { file: "sfx/clink1.wav", len: 384, lead: 0, loud: -11.9 },
  swishSmall: { file: "sfx/swishSmall.wav", len: 298, lead: 74, loud: -11.9 },
  // added for the founder reel (CC0, BigSoundBank): paper, rope whoosh, road map, pen click, Nikon shutter
  page_turn_single: { file: "sfx/page_turn_single.wav", len: 518, lead: 175, loud: -20.0 },
  pages_flip_multi: { file: "sfx/pages_flip_multi.wav", len: 2352, lead: 721, loud: -17.8 },
  whoosh_rope: { file: "sfx/whoosh_rope.wav", len: 550, lead: 200, loud: -11.1 },
  road_map_unfold: { file: "sfx/road_map_unfold.wav", len: 1418, lead: 925, loud: -19.0 },
  pen_click: { file: "sfx/pen_click.wav", len: 254, lead: 139, loud: -27.6 },
  camera_shutter_nikon: { file: "sfx/camera_shutter_nikon.wav", len: 310, lead: 180, loud: -16.1 },
  // v6: "Whoosh Passenger Plane" by SoundReality (Pixabay Content License), 3.20 s, peak (closest point) at 1837 ms, peak -3 dBFS
  plane_whoosh: { file: "sfx/plane_whoosh.wav", len: 3200, lead: 1837, loud: -12.3 },
  // spare CC0 recordings (BigSoundBank), measured the same way: lead = loudest point (closest pass / peak cheer)
  airplanePass: { file: "sfx/airplanePass.wav", len: 4200, lead: 2475, loud: -17.8 },
  airplane_pass1_flyby: { file: "sfx/airplane_pass1_flyby.wav", len: 2968, lead: 1650, loud: -19.1 },
  crowd_yeah_applause: { file: "sfx/crowd_yeah_applause.wav", len: 3342, lead: 250, loud: -13.6 },
} as const;
export type SoundName = keyof typeof SOUNDS;

/** at = the video frame the sound sits on (the file's `lead` point); vol = volume 0–1; name shows in the Studio timeline.
 *  until = frame where the sound ends (when its animation ends): the last 2 frames (~66 ms) fade out.
 *  skip = ms cut from the start of the file (the sound then starts mid run-up with a 3-frame fade-in); `at` stays on the `lead` point. */
export type Cue = { at: number; s: SoundName; vol: number; name: string; until?: number; skip?: number };

/** Milliseconds → frames (30 fps). */
const fr = (ms: number) => Math.round(ms * 0.03);

/** Start and end frame of a cue in the video (used by SfxTrack and cue tables). */
export const cueSpan = (c: Cue) => {
  const S = SOUNDS[c.s];
  const skipF = c.skip ? fr(c.skip) : 0;
  let from = c.at - fr(S.lead) + skipF;
  let trim = skipF;
  if (from < 0) {
    trim += -from;
    from = 0;
  }
  const natural = from + Math.ceil(S.len * 0.03) + 2 - trim;
  const end = c.until !== undefined ? Math.min(c.until, natural) : natural;
  return { from, trim, end: Math.max(from + 1, end), cut: c.until !== undefined && c.until < natural };
};

/** Plays every cue as its own named Sequence. volume = master fader for all of them. */
export const SfxTrack: React.FC<{ cues: Cue[]; volume?: number }> = ({ cues, volume = 1 }) => (
  <>
    {cues.map((c, i) => {
      const S = SOUNDS[c.s];
      const { from, trim, end, cut } = cueSpan(c);
      const dur = end - from;
      const gain = (f: number) => {
        let g = 1;
        if (cut) g = Math.min(g, Math.max(0, (dur - 1 - f) / 2)); // 2-frame fade-out, silent on the last frame
        if (trim > 0 && c.skip) g = Math.min(g, (f + 1) / 3); // 3-frame fade-in when starting mid-file
        return c.vol * volume * g;
      };
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`SFX · ${c.name}`}>
          <Audio src={staticFile(S.file)} trimBefore={trim || undefined} volume={cut || (trim > 0 && c.skip) ? gain : c.vol * volume} />
        </Sequence>
      );
    })}
  </>
);
