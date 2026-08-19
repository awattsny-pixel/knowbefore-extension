import type { EvidenceState } from "../shared/types";

/** Duplicated from knowbefore-app's src/components/canvas/EvidenceMark.tsx
    by deliberate choice — see the MVP Build Plan, Section 12. Must stay
    visually identical: same shield path, same four states, same rule
    that state lives in fill/stroke/dash, never a redrawn outline. If
    this ever drifts from the app's version, that's the signal to
    finally extract a shared package — not before. */

const SHIELD_PATH =
  "M12 2.5L20.5 6.2V11.4C20.5 16.6 17 20.6 12 21.9C7 20.6 3.5 16.6 3.5 11.4V6.2L12 2.5Z";
const CHECK_PATH = "M8.3 12.1L10.7 14.5L15.7 9.5";

const VERIFIED = "#1f6f68";
const PAPER = "#ffffff";
const INK_FAINT = "#7c8580";

export function EvidenceMark({ state, size = 16 }: { state: EvidenceState; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0 }}>
      {state === "confirmed" && (
        <>
          <path d={SHIELD_PATH} fill={VERIFIED} stroke={VERIFIED} strokeWidth={1.4} strokeLinejoin="round" />
          <path d={CHECK_PATH} fill="none" stroke={PAPER} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {state === "inferred" && (
        <>
          <path d={SHIELD_PATH} fill={VERIFIED} fillOpacity={0.14} stroke={VERIFIED} strokeWidth={1.6} strokeLinejoin="round" />
          <path d={CHECK_PATH} fill="none" stroke={VERIFIED} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {state === "assumed" && (
        <>
          <path d={SHIELD_PATH} fill="none" stroke={VERIFIED} strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="2.6 2.2" />
          <circle cx={12} cy={13} r={1.7} fill={VERIFIED} />
        </>
      )}
      {state === "unknown" && (
        <path d={SHIELD_PATH} fill="none" stroke={INK_FAINT} strokeWidth={1.4} strokeLinejoin="round" strokeDasharray="1.5 2.6" />
      )}
    </svg>
  );
}
