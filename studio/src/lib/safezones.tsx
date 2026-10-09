// Safe zones: the parts of a 1080x1920 frame that TikTok and Instagram Reels cover with their own UI.
// Render preview stills with this overlay on (prop `safeZones: true`) and keep every word out of the red.
// Photos and footage may run under the red areas; text may not.
//
// Values are the union of both apps, measured on a 1080x1920 canvas:
//   top bar        0-220 px          status bar, "Following / For You", search
//   right column   135 px wide, from 45% to 80% of the height (profile, like, comment, share, sound)
//   bottom         the last 450 px   caption, username, sound name, progress bar
// So the area that is always safe for text is x 0-945 px, y 220-1470 px.
import React from "react";
import { AbsoluteFill } from "remotion";

export const SAFE = {
  top: 220,
  bottom: 450,
  right: 135,
  rightFrom: 0.45,
  rightTo: 0.8,
} as const;

const RED = "rgba(255,0,0,0.28)";

export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: SAFE.top, background: RED }} />
    <div
      style={{
        position: "absolute",
        right: 0,
        width: SAFE.right,
        top: `${SAFE.rightFrom * 100}%`,
        bottom: `${(1 - SAFE.rightTo) * 100}%`,
        background: RED,
      }}
    />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: SAFE.bottom, background: RED }} />
  </AbsoluteFill>
);
