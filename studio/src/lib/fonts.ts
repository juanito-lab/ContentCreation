// v7: the reel uses exactly three typefaces, all SIL OFL and bundled in public/fonts (no network at render time).
// Juan's picks are Apple system fonts (Big Caslon, SF Pro Display Bold, Snell Roundhand), which can't be copied to this renderer,
// so these are the closest free lookalikes:
//  - sans   = Inter Tight 700 ("SF Pro Display Bold"): names, numbers, hero words (Zürich, Stanford, MANTAI, 4 weeks, Juan)
//  - serif  = Libre Caslon Display ("Big Caslon"): elegant lines and small connectors (to chase my, I talked to, then, in advance)
//  - script = Great Vibes ("Snell Roundhand"; Pinyon Script is finer/thinner, Great Vibes keeps its roundhand shape and stays
//             readable at big sizes over footage): the emotional words in red (dream, Santiago, co-founder, late nights, beginning)
// The old keys (sansLight, serifItalic, hand, brush, elegant) are kept as aliases so FounderIntro/Demo/Short still compile; they now
// resolve to these three faces.
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const load = (family: string, file: string, weight: string, style = "normal") =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style, format: "woff2" });

export const fontsReady = Promise.all([
  load("Inter Tight", "inter-tight-latin-700-normal.woff2", "700"),
  load("Libre Caslon Display", "libre-caslon-display-latin-400-normal.woff2", "400"),
  load("Great Vibes", "great-vibes-latin-400-normal.woff2", "400"),
]);

export type FontKey = "sans" | "serif" | "script" | "sansLight" | "serifItalic" | "hand" | "brush" | "elegant";

const SANS: React.CSSProperties = { fontFamily: "Inter Tight", fontWeight: 700, letterSpacing: "-0.03em" };
const SERIF: React.CSSProperties = { fontFamily: "Libre Caslon Display", fontWeight: 400, letterSpacing: "-0.01em" };
const SCRIPT: React.CSSProperties = { fontFamily: "Great Vibes", fontWeight: 400, letterSpacing: "0" };

export const FONTS: Record<FontKey, React.CSSProperties> = {
  sans: SANS,
  serif: SERIF,
  script: SCRIPT,
  sansLight: SERIF,
  serifItalic: SERIF,
  hand: SERIF,
  brush: SCRIPT,
  elegant: SERIF,
};
