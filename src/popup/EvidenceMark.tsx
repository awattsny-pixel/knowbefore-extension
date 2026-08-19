import { useState, type CSSProperties } from "react";
import type { EvidenceState } from "../shared/types";

/** Duplicated from knowbefore-app's src/components/canvas/EvidenceMark.tsx
    by deliberate choice — see the MVP Build Plan, Section 12. Must stay
    visually identical: same shield path, same four states, same rule
    that state lives in fill/stroke/dash, never a redrawn outline. If
    this ever drifts from the app's version, that's the signal to
    finally extract a shared package — not before.

    The hover tooltip below is extension-only for now — the popup is a
    tight 320px panel where a one-line reminder of what each mark means
    earns its keep more than it does in the full canvas, where the
    System Reference doc is one click away. */

const SHIELD_PATH =
  "M12 2.5L20.5 6.2V11.4C20.5 16.6 17 20.6 12 21.9C7 20.6 3.5 16.6 3.5 11.4V6.2L12 2.5Z";
const CHECK_PATH = "M8.3 12.1L10.7 14.5L15.7 9.5";

const VERIFIED = "#1f6f68";
const PAPER = "#ffffff";
const INK = "#1b2220";
const INK_FAINT = "#7c8580";

const STATE_COPY: Record<EvidenceState, { label: string; def: string }> = {
  confirmed: { label: "Confirmed", def: "Traced directly to a source on this page." },
  inferred: { label: "Inferred", def: "Reasoned from what's stated, not said outright." },
  assumed: { label: "Assumed", def: "A plausible guess — hedged, not confirmed by this page." },
  unknown: { label: "Unknown", def: "A real gap. Not addressed anywhere on this page." },
};

function ShieldSvg({ state, size }: { state: EvidenceState; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0, display: "block" }}>
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

export function EvidenceMark({ state, size = 16 }: { state: EvidenceState; size?: number }) {
  const [hovered, setHovered] = useState(false);
  const copy = STATE_COPY[state];

  return (
    <span
      style={wrapperStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      role="img"
      aria-label={`${copy.label} — ${copy.def}`}
    >
      <ShieldSvg state={state} size={size} />
      {hovered && (
        <span style={tooltipStyle} role="tooltip">
          <strong style={tooltipLabel}>{copy.label}</strong>
          <span style={tooltipDef}>{copy.def}</span>
        </span>
      )}
    </span>
  );
}

const wrapperStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  flexShrink: 0,
  outline: "none",
  cursor: "default",
};

const tooltipStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "calc(100% + 8px)",
  transform: "translateY(-50%)",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  width: 190,
  padding: "8px 10px",
  background: INK,
  color: PAPER,
  borderRadius: 6,
  boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  pointerEvents: "none",
};

const tooltipLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "#7fc4b8",
};

const tooltipDef: CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.4,
  color: PAPER,
};
