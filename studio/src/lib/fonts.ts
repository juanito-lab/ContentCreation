// Fonts are bundled in public/fonts (OFL, from Fontsource) so renders work offline and on servers
// without Google Fonts access.
// - sans: tight heavy grotesk (Inter, negative letter-spacing)
// - serifItalic: Didone italic (Playfair Display Italic)
// - script: handwriting (Pinyon Script)
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const load = (family: string, file: string, weight: string, style = "normal") =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style, format: "woff2" });

export const fontsReady = Promise.all([
  load("Inter", "inter-latin-500-normal.woff2", "500"),
  load("Inter", "inter-latin-800-normal.woff2", "800"),
  load("Inter", "inter-latin-900-normal.woff2", "900"),
  load("Playfair Display", "playfair-display-latin-400-italic.woff2", "400", "italic"),
  load("Pinyon Script", "pinyon-script-latin-400-normal.woff2", "400"),
  load("Caveat", "caveat-latin-600-normal.woff2", "600"),
  load("Caveat", "caveat-latin-700-normal.woff2", "700"),
  load("Instrument Serif", "instrument-serif-latin-400-italic.woff2", "400", "italic"),
  load("Dancing Script", "dancing-script-latin-700-normal.woff2", "700"),
]);

/** hand = marker handwriting (Caveat) for notes/annotations, brush = bold flowing cursive (Dancing Script), elegant = Instrument Serif italic */
export type FontKey = "sans" | "sansLight" | "serifItalic" | "script" | "hand" | "brush" | "elegant";

export const FONTS: Record<FontKey, React.CSSProperties> = {
  sans: { fontFamily: "Inter", fontWeight: 800, letterSpacing: "-0.05em" },
  sansLight: { fontFamily: "Inter", fontWeight: 500, letterSpacing: "-0.03em" },
  serifItalic: { fontFamily: "Playfair Display", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em" },
  script: { fontFamily: "Pinyon Script", fontWeight: 400, letterSpacing: "0" },
  hand: { fontFamily: "Caveat", fontWeight: 700, letterSpacing: "0" },
  brush: { fontFamily: "Dancing Script", fontWeight: 700, letterSpacing: "-0.01em" },
  elegant: { fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" },
};
