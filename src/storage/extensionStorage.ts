/** Thin wrapper around chrome.storage.local. The extension token is
    the only thing of consequence stored here — see the Auth Bridge
    design in the MVP Build Plan, Section 10: it's a narrowly-scoped
    token (scope: "extension"), not the user's full web session, so
    this storage being weaker than an HttpOnly cookie is a bounded
    risk rather than a full-account one. */

const TOKEN_KEY = "kb_extension_token";

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
