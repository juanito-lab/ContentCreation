import { Composition } from "remotion";
import { Short, shortDefaults, shortSchema, calculateShortMetadata } from "./Short";
import type { ShortProps } from "./Short";
import { Demo, DEMO_FRAMES, demoDefaults, demoSchema } from "./examples/demo/Demo";
import { FounderIntro, founderDefaults, founderSchema, calculateFounderMetadata } from "./examples/founder-mix/FounderIntro";
import type { FounderProps } from "./examples/founder-mix/FounderIntro";
import { FounderMix, mixDefaults, mixSchema, calculateMixMetadata } from "./examples/founder-mix/FounderMix";
import type { MixProps } from "./examples/founder-mix/FounderMix";

export const RemotionRoot: React.FC = () => (
  <>
    {/* Short: one JSON spec = one video. This is the composition tools/make.sh renders. Start here. */}
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
    {/* Demo: the hand-coded reference edit from Jasper Kallfelz's shortform-edit-kit (no media needed). */}
    <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1080} height={1920} schema={demoSchema} defaultProps={demoDefaults} />
    {/* Case study: the hand-coded MantAI founder reel. Needs the creator's own media in public/mix/ and public/vo/
        (git-ignored), so it shows missing-file errors on a fresh clone. See videos/founder-mix/README.md. */}
    <Composition id="FounderMix" component={FounderMix} durationInFrames={1052} fps={30} width={1080} height={1920} schema={mixSchema} defaultProps={mixDefaults as MixProps} calculateMetadata={calculateMixMetadata} />
    {/* Case study, first draft of the same reel (graphics-only beats, shared with FounderMix). */}
    <Composition id="FounderIntro" component={FounderIntro} durationInFrames={660} fps={30} width={1080} height={1920} schema={founderSchema} defaultProps={founderDefaults as FounderProps} calculateMetadata={calculateFounderMetadata} />
  </>
);
