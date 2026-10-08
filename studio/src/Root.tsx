import { Composition } from "remotion";
import { Demo, DEMO_FRAMES, demoDefaults, demoSchema } from "./Demo";
import { Short, shortDefaults, shortSchema, calculateShortMetadata } from "./Short";
import type { ShortProps } from "./Short";
import { FounderIntro, founderDefaults, founderSchema, calculateFounderMetadata } from "./FounderIntro";
import type { FounderProps } from "./FounderIntro";
import { FounderMix, mixDefaults, mixSchema, calculateMixMetadata } from "./FounderMix";
import type { MixProps } from "./FounderMix";

export const RemotionRoot: React.FC = () => (
  <>
    {/* Jasper x Santi mix with Juan's real footage. */}
    <Composition id="FounderMix" component={FounderMix} durationInFrames={970} fps={30} width={1080} height={1920} schema={mixSchema} defaultProps={mixDefaults as MixProps} calculateMetadata={calculateMixMetadata} />
    {/* MantAI founder intro (structure of the Jasper/ATHLAITE reel). */}
    <Composition id="FounderIntro" component={FounderIntro} durationInFrames={660} fps={30} width={1080} height={1920} schema={founderSchema} defaultProps={founderDefaults as FounderProps} calculateMetadata={calculateFounderMetadata} />
    {/* Short: one JSON spec = one video. Used by make.sh / Hermes. */}
    <Composition
      id="Short"
      component={Short}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      schema={shortSchema}
      defaultProps={shortDefaults as ShortProps}
      calculateMetadata={calculateShortMetadata}
    />
    {/* Demo: the original kit example, kept as a reference for hand-built edits. */}
    <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1080} height={1920} schema={demoSchema} defaultProps={demoDefaults} />
  </>
);
