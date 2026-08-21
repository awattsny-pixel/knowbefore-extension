import {
  setStoredToken,
  clearStoredToken,
  getAutoNudgeEnabled,
  setAutoNudgeEnabled,
} from "../storage/extensionStorage";

/** Receives the scoped token from knowbefore.ai/extension/connect via
    externally_connectable (manifest restricts the sender origin to the
    KnowBefore domain — see manifest.json). This is step 3 of the Auth
    Bridge design in the MVP Build Plan, Section 10. */
export function registerAuthBridge(): void {
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (!sender.url || !isTrustedOrigin(sender.url)) {
      sendResponse({ ok: false, error: "untrusted_sender" });
      return;
    }

    if (message?.type === "KB_CONNECT" && typeof message.token === "string") {
      setStoredToken(message.token).then(() => sendResponse({ ok: true }));
      return true; // keep the message channel open for the async response
    }

    if (message?.type === "KB_DISCONNECT") {
      clearStoredToken().then(() => sendResponse({ ok: true }));
      return true;
    }

    // The auto-nudge preference lives in this extension's own storage
    // (see extensionStorage.getAutoNudgeEnabled) — these two let the
    // settings page on knowbefore.ai read and change it, the same
    // trusted-origin pattern as KB_CONNECT above.
    if (message?.type === "KB_GET_AUTO_NUDGE") {
      getAutoNudgeEnabled().then((enabled) => sendResponse({ ok: true, enabled }));
      return true;
    }

    if (message?.type === "KB_SET_AUTO_NUDGE" && typeof message.enabled === "boolean") {
      setAutoNudgeEnabled(message.enabled).then(() => sendResponse({ ok: true }));
      return true;
    }

    sendResponse({ ok: false, error: "unknown_message" });
  });
}

function isTrustedOrigin(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return (
      origin === "https://knowbefore.ai" ||
      origin === "https://www.knowbefore.ai" ||
      origin === "http://localhost:3000"
    );
  } catch {
    return false;
  }
}
