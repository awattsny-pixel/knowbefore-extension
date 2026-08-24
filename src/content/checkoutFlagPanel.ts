import type { CheckoutFlag, EvidenceState } from "../shared/types";
import { NAVY, GOLD_LIGHT, INK, INK_MUTED, RULE, PAPER } from "../popup/theme";

/** The anchored panel for checkout flags — a more specific sibling of
    ambientSignal.ts's generic "worth understanding first?" prompt.
    Shown instead of that generic prompt when checkoutSignals.ts finds
    something concrete: real content (renewal date, pre-checked
    add-on), not just "click to find out." Same non-blocking rule
    applies -- never a modal, dismissible, nothing sent anywhere until
    "See details" is clicked.

    Embedded as a real DOM sibling of its anchor (see ambientSignal.ts's
    showInlinePrompt for the same reasoning) rather than an absolutely-
    positioned overlay that vanished on scroll -- this one specifically
    is designed to anchor next to a detected price element when
    checkoutSignals.findPriceAnchor() finds one, the same way a Honey
    badge sits next to Amazon's price, falling back to the trigger
    button when no price element was found. */

const PANEL_ID = "knowbefore-checkout-flag-panel";
const PANEL_STYLE_ID = "knowbefore-checkout-flag-panel-style";

// Same shield glyph as popup/EvidenceMark.tsx -- kept pixel-identical
// on purpose (see that file's own comment) rather than reinvented here.
const SHIELD_PATH = "M12 2.5L20.5 6.2V11.4C20.5 16.6 17 20.6 12 21.9C7 20.6 3.5 16.6 3.5 11.4V6.2L12 2.5Z";
const CHECK_PATH = "M8.3 12.1L10.7 14.5L15.7 9.5";
const VERIFIED = "#1f6f68";
const INK_FAINT = "#7c8580";

function shieldSvg(state: EvidenceState): string {
  if (state === "confirmed") {
    return `<svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px;">
      <path d="${SHIELD_PATH}" fill="${VERIFIED}" stroke="${VERIFIED}" stroke-width="1.4" stroke-linejoin="round" />
      <path d="${CHECK_PATH}" fill="none" stroke="${PAPER}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`;
  }
  // assumed
  return `<svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px;">
    <path d="${SHIELD_PATH}" fill="none" stroke="${INK_FAINT}" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="2.6 2.2" />
    <circle cx="12" cy="13" r="1.7" fill="${INK_FAINT}" />
  </svg>`;
}

function ensureStyle(): void {
  if (document.getElementById(PANEL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PANEL_STYLE_ID;
  style.textContent = `
    @keyframes kb-checkout-panel-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

export function showCheckoutFlagPanel(anchor: Element, flags: CheckoutFlag[], onSeeDetails: () => void): void {
  if (document.getElementById(PANEL_ID)) return;
  if (flags.length === 0) return;
  ensureStyle();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  const embedded = anchor !== document.body;
  panel.style.cssText = [
    embedded ? "position: relative" : "position: fixed",
    ...(embedded ? ["margin-top: 6px"] : ["bottom: 20px", "right: 20px"]),
    "z-index: 2147483647",
    `font-family: -apple-system, 'Segoe UI', sans-serif`,
    `background: ${PAPER}`,
    "padding: 14px",
    "border-radius: 12px",
    `border: 1px solid ${RULE}`,
    "box-shadow: 0 8px 24px rgba(11,45,77,0.16)",
    "animation: kb-checkout-panel-in 200ms ease-out",
    "width: 320px",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;";
  header.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round" />
      <path d="M32 51 L45 64 L70 36" fill="none" stroke="${GOLD_LIGHT}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span style="font-size:12px;font-weight:700;color:${NAVY};letter-spacing:0.3px;">KNOWBEFORE — BEFORE YOU CHECK OUT</span>
  `;
  panel.appendChild(header);

  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:12px;";
  for (const flag of flags) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;align-items:flex-start;";
    row.innerHTML = `${shieldSvg(flag.state)}<span style="font-size:12.5px;line-height:1.4;color:${INK};">${flag.label}</span>`;
    list.appendChild(row);
  }
  panel.appendChild(list);

  const details = document.createElement("button");
  details.type = "button";
  details.textContent = "See full details →";
  details.style.cssText = [
    "display:block", "width:100%", "padding:9px 12px",
    `background:${NAVY}`, "color:#ffffff", "font-size:12.5px", "font-weight:600",
    "border:none", "border-radius:6px", "cursor:pointer", "font-family:inherit",
  ].join(";");
  details.addEventListener("click", () => {
    onSeeDetails();
    dismiss();
  });
  panel.appendChild(details);

  const dismissLink = document.createElement("button");
  dismissLink.type = "button";
  dismissLink.textContent = "Dismiss";
  dismissLink.style.cssText = [
    "display:block", "width:100%", "margin-top:6px", "padding:4px",
    "background:transparent", `color:${INK_MUTED}`, "font-size:11.5px",
    "border:none", "cursor:pointer", "font-family:inherit",
  ].join(";");
  dismissLink.addEventListener("click", () => dismiss());
  panel.appendChild(dismissLink);

  function dismiss() {
    panel.remove();
  }

  if (embedded) {
    anchor.insertAdjacentElement("afterend", panel);
  } else {
    document.body.appendChild(panel);
  }
}
