import { runDetection } from "./commitmentDetector";
import { detectPdfContext } from "./pdfSignal";
import { showAmbientBadgeSignal, clearAmbientBadgeSignal, showInlinePrompt } from "./ambientSignal";
import { extractCheckoutFlags, findPriceAnchor } from "./checkoutSignals";
import { showCheckoutFlagPanel } from "./checkoutFlagPanel";
import { getAutoNudgeEnabled } from "../storage/extensionStorage";
import type { DetectionSignal } from "../shared/types";

/** Phase 0 entry point (MVP Build Plan, Section 13). Runs the two
    in-scope detectors, and if either fires, shows the local-only
    ambient signal. Nothing here makes a network request — see
    Section 3, "the trust boundary is the click."

    The toolbar badge always reflects a detection; the in-page inline
    prompt is opt-in (default off) — see extensionStorage's
    getAutoNudgeEnabled for why that's a visibility setting, not a
    consent one. */

function detect(): DetectionSignal | null {
  return detectPdfContext() ?? runDetection();
}

/** True once this content script's extension context has been torn
    down — e.g. the extension was reloaded/updated while this tab was
    already open. chrome.runtime itself goes undefined at that point;
    every call below is guarded on this so a stale script goes quiet
    instead of throwing on every SPA navigation. */
function isContextInvalidated(): boolean {
  return typeof chrome === "undefined" || !chrome.runtime;
}

function triggerFor(signal: DetectionSignal): Element | null {
  // Re-find the same trigger element the detector matched, so the
  // inline prompt anchors to the real button rather than a fixed spot.
  const candidates = document.querySelectorAll("button, a, input[type=submit], [role=button]");
  for (const el of candidates) {
    const text = (el.textContent || "").trim().toLowerCase();
    if (text === signal.detectedAction || text.includes(signal.detectedAction)) return el;
  }
  return document.body;
}

async function init() {
  if (isContextInvalidated()) {
    observer.disconnect();
    return;
  }

  const signal = detect();
  if (!signal) {
    // Badge is now per-tab (see serviceWorker.ts's SET_BADGE handler),
    // but within one tab an SPA navigation can go from a detected page
    // to a non-detected one without a fresh document load -- clear it
    // explicitly rather than leaving the last page's badge lit.
    clearAmbientBadgeSignal();
    return;
  }

  showAmbientBadgeSignal();
  chrome.runtime.sendMessage({ type: "DETECTION_SIGNAL", signal });

  if (!(await getAutoNudgeEnabled())) return;

  const anchor = triggerFor(signal);
  if (!anchor) return;

  const openQuickTake = () => {
    if (isContextInvalidated()) return;
    chrome.runtime.sendMessage({ type: "OPEN_QUICK_TAKE", signal });
  };

  // Checkout flags are more specific and more valuable than the
  // generic "worth understanding first?" prompt, so they take the
  // same single slot instead of stacking two panels -- both are
  // gated by the same auto-nudge setting either way (see
  // extensionStorage.getAutoNudgeEnabled: this setting governs
  // whether ANY in-page visual appears, not just the generic one).
  const flags = extractCheckoutFlags();
  if (flags.length > 0) {
    // Stashed for the popup to read if the user clicks through to
    // Quick Take -- see QuickTakePanel's subscriptions-summary fetch.
    // Still local storage via the service worker, not a network call.
    chrome.runtime.sendMessage({ type: "SET_CHECKOUT_FLAGS", flags });
    // Prefer embedding next to an actual price on the page over the
    // trigger button -- see checkoutSignals.findPriceAnchor's comment.
    showCheckoutFlagPanel(findPriceAnchor() ?? anchor, flags, openQuickTake);
  } else {
    showInlinePrompt(anchor, openQuickTake);
  }
}

// document_idle in the manifest already waits for a settled DOM, but
// re-run on SPA navigations, which don't fire a fresh document load.
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
init();
