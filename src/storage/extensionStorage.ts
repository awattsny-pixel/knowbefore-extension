/** Thin wrapper around chrome.storage.local. The extension token is
    the only thing of consequence stored here — see the Auth Bridge
    design in the MVP Build Plan, Section 10: it's a narrowly-scoped
    token (scope: "extension"), not the user's full web session, so
    this storage being weaker than an HttpOnly cookie is a bounded
    risk rather than a full-account one. */

import type { CheckoutFlag, DetectionSignal } from "../shared/types";

const TOKEN_KEY = "kb_extension_token";
const DETECTION_KEY_PREFIX = "kb_detection_";
const AUTO_NUDGE_KEY = "kb_auto_nudge_enabled";
const CHECKOUT_FLAGS_KEY_PREFIX = "kb_checkout_flags_";

export async function getStoredToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] ?? null;
}

export async function setStoredToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearStoredToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

/** Opt-in setting (default off): whether the content script's inline
    "worth understanding first?" prompt appears on detection at all.
    The ambient toolbar badge always shows regardless — this setting
    governs the in-page nudge only, per the "sends nothing until you
    click" trust boundary: enabling it changes when the prompt to
    click appears, never whether a click is still required. */
export async function getAutoNudgeEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(AUTO_NUDGE_KEY);
  return result[AUTO_NUDGE_KEY] ?? false;
}

export async function setAutoNudgeEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [AUTO_NUDGE_KEY]: enabled });
}

/** The content script's classification is the only source of truth for
    commitmentType — the popup has no detector of its own. Keyed by tab,
    since a user can have KnowBefore-relevant tabs open simultaneously. */
export async function setLastDetection(tabId: number, signal: DetectionSignal): Promise<void> {
  await chrome.storage.local.set({ [DETECTION_KEY_PREFIX + tabId]: signal });
}

export async function getLastDetection(tabId: number): Promise<DetectionSignal | null> {
  const key = DETECTION_KEY_PREFIX + tabId;
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

/** Mirrors setLastDetection/getLastDetection but for checkoutSignals.ts's
    output -- the popup has no DOM access of its own, so it reads back
    whatever the content script already found locally on this tab. */
export async function setLastCheckoutFlags(tabId: number, flags: CheckoutFlag[]): Promise<void> {
  await chrome.storage.local.set({ [CHECKOUT_FLAGS_KEY_PREFIX + tabId]: flags });
}

export async function getLastCheckoutFlags(tabId: number): Promise<CheckoutFlag[]> {
  const key = CHECKOUT_FLAGS_KEY_PREFIX + tabId;
  const result = await chrome.storage.local.get(key);
  return result[key] ?? [];
}
