import { setStoredToken, clearStoredToken } from "../storage/extensionStorage";

/** Receives the scoped token from knowbefore.app/extension/connect via
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

    sendResponse({ ok: false, error: "unknown_message" });
  });
}

function isTrustedOrigin(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    return origin === "https://knowbefore.app" || origin === "http://localhost:3000";
  } catch {
    return false;
  }
}
