import { registerAuthBridge } from "./authBridge";
import { setLastDetection } from "../storage/extensionStorage";

/** Phase 0/1 message router (MVP Build Plan, Section 13). Owns the
    toolbar badge and forwards detection telemetry — still entirely
    local. The actual /api/extension/quick-take call happens from the
    popup (src/popup/popup.ts) once the user has clicked, per Section 3:
    the click is what's allowed to leave the device, not anything the
    service worker does on its own. */

registerAuthBridge();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.type) {
    case "SET_BADGE": {
      // Scoped to the sending tab -- without tabId, setBadgeText sets
      // the badge globally, so it stayed lit on every other tab too
      // once any single tab had a detection. Falls back to the
      // unscoped (global) form only if the sender has no tab, which
      // shouldn't happen for a content-script sender in practice.
      const isAvailable = message.state === "available";
      const tabId = sender.tab?.id;
      chrome.action.setBadgeText({ text: isAvailable ? "•" : "", ...(tabId != null ? { tabId } : {}) });
      chrome.action.setBadgeBackgroundColor({ color: "#1f6f68", ...(tabId != null ? { tabId } : {}) });
      break;
    }
    case "DETECTION_SIGNAL": {
      // The popup has no detector of its own — this is the only place
      // commitmentType gets recorded, keyed by tab, so the popup can
      // read it later and the purchase-options category boundary
      // (Appendix B) has a real signal to gate on.
      if (sender.tab?.id != null) {
        setLastDetection(sender.tab.id, message.signal);
      }
      // Phase 1 telemetry hook (Section 15: Detection Precision,
      // Intervention Rate). Local console log only in this scaffold —
      // wire to a real (privacy-respecting) telemetry sink before
      // Phase 1 testing begins.
      console.debug("[KnowBefore] detection signal", message.signal);
      break;
    }
    case "OPEN_QUICK_TAKE": {
      chrome.action.openPopup?.().catch(() => {
        // openPopup isn't available in every context; the badge click
        // still opens src/popup/popup.html normally.
      });
      break;
    }
  }
  sendResponse({ ok: true });
  return false;
});
