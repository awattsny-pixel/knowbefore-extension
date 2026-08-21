import { runDetection } from "./commitmentDetector";
import { detectPdfContext } from "./pdfSignal";
import { showAmbientBadgeSignal, showInlinePrompt } from "./ambientSignal";
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
  const signal = detect();
  if (!signal) return;

  showAmbientBadgeSignal();
  chrome.runtime.sendMessage({ type: "DETECTION_SIGNAL", signal });

  if (!(await getAutoNudgeEnabled())) return;

  const anchor = triggerFor(signal);
  if (anchor) {
    showInlinePrompt(anchor, () => {
      chrome.runtime.sendMessage({ type: "OPEN_QUICK_TAKE", signal });
    });
  }
}

// document_idle in the manifest already waits for a settled DOM, but
// re-run on SPA navigations, which don't fire a fresh document load.
init();
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
}).observe(document.body, { childList: true, subtree: true });
