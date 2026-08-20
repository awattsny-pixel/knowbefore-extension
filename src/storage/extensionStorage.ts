/** Thin wrapper around chrome.storage.local. The extension token is
    the only thing of consequence stored here — see the Auth Bridge
    design in the MVP Build Plan, Section 10: it's a narrowly-scoped
    token (scope: "extension"), not the user's full web session, so
    this storage being weaker than an HttpOnly cookie is a bounded
    risk rather than a full-account one. */

import type { DetectionSignal } from "../shared/types";

const TOKEN_KEY = "kb_extension_token";
const DETECTION_KEY_PREFIX = "kb_detection_";

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
