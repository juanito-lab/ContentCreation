// Wort-DSL: jedes Wort hat Schrift, Größe, Position (% der Fläche) und einen Einsatz-Frame.
// v7: Wörter erscheinen hart auf einem Frame und stehen still (keine Animation).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FONTS, FontKey } from "./fonts";

export const wordSchema = z.object({
  text: z.string(),
  at: z.number().int().nonnegative(),
  font: z.enum(["sans", "serif", "script", "sansLight", "serifItalic", "hand", "brush", "elegant"]).default("sans"),
  size: z.number().positive(),
  x: z.number(),
  y: z.number(),
  weight: z.number().optional(),
  color: z.string().optional(),
  until: z.number().int().optional(),
  rotate: z.number().optional(),
  /** v8: per-word override of the beat's shared shadow (e.g. a heavier stack for a caption over a busy backdrop). */
  shadow: z.string().optional(),
  /** v8: faux-bold via -webkit-text-stroke (thickens the glyph with the same ink as the fill) — used instead of a
   *  heavier font weight, since only Inter Tight 700 is loaded. e.g. "3px #fff" for a bolder white caption. */
  stroke: z.string().optional(),
  /** v8: per-word letter-spacing override (CSS value, e.g. "-0.08em") — reclaims width for a long phrase set bigger. */
  tracking: z.string().optional(),
});
export type Word = z.infer<typeof wordSchema>;

/** v7: text is static. A word appears on its frame (hard cut, no pop/tilt/fade) and stays pixel-still until `until` (also a hard cut). */
const WordItem: React.FC<{ w: Word; color: string; shadow?: string }> = ({ w, color, shadow }) => {
  const frame = useCurrentFrame();
  if (frame < w.at || (w.until !== undefined && frame >= w.until)) return null;
  const font = FONTS[w.font as FontKey];
  return (
    <div
      style={{
        position: "absolute",
        left: `${w.x}%`,
        top: `${w.y}%`,
        transform: `translate(-50%, -50%)${w.rotate ? ` rotate(${w.rotate}deg)` : ""}`,
        color: w.color ?? color,
        fontSize: font.fontFamily === "Great Vibes" ? w.size * 1.12 : w.size, // Great Vibes sets small for its size
        lineHeight: 1,
        whiteSpace: "nowrap",
        textShadow: w.shadow ?? shadow,
        ...font,
        ...(w.weight && font.fontFamily === "Inter Tight" ? { fontWeight: w.weight } : null),
        ...(w.stroke ? { WebkitTextStroke: w.stroke } : null),
        ...(w.tracking ? { letterSpacing: w.tracking } : null),
      }}
    >
      {w.text}
    </div>
  );
};

/** Absolut platzierte Wörter. `shadow` z. B. für weiße Wörter über Video. */
export const Words: React.FC<{ words: Word[]; color?: string; shadow?: string }> = ({ words, color = "#000", shadow }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {words.map((w, i) => (
      <WordItem key={`${i}-${w.text}`} w={w} color={color} shadow={shadow} />
    ))}
  </AbsoluteFill>
);

export const WHITE_SHADOW = "0 2px 18px rgba(0,0,0,0.45), 0 0 2px rgba(0,0,0,0.6)";

/** Hilfe: Frames aus Sekunden bei 30 fps. */
export const s = (sec: number) => Math.round(sec * 30);
