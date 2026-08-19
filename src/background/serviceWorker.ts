import { registerAuthBridge } from "./authBridge";

/** Phase 0/1 message router (MVP Build Plan, Section 13). Owns the
    toolbar badge and forwards detection telemetry — still entirely
    local. The actual /api/extension/quick-take call happens from the
    popup (src/popup/popup.ts) once the user has clicked, per Section 3:
    the click is what's allowed to leave the device, not anything the
    service worker does on its own. */

registerAuthBridge();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case "SET_BADGE": {
      const isAvailable = message.state === "available";
      chrome.action.setBadgeText({ text: isAvailable ? "•" : "" });
      chrome.action.setBadgeBackgroundColor({ color: "#1f6f68" });
      break;
    }
    case "DETECTION_SIGNAL": {
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
