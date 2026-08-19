import { getStoredToken } from "../storage/extensionStorage";
import type { QuickTakeRequest, QuickTakeResponse } from "./types";

// Swap to https://knowbefore.app for production builds.
const API_BASE = "http://localhost:3000";

export class NotConnectedError extends Error {
  constructor() {
    super("not_connected");
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super("session_expired");
  }
}

/** The only function in this codebase allowed to call the platform.
    Everything upstream of this (content scripts, the badge, the
    inline prompt) is local-only — see Section 3 of the MVP Build Plan. */
export async function fetchQuickTake(request: QuickTakeRequest): Promise<QuickTakeResponse> {
  const token = await getStoredToken();
  if (!token) throw new NotConnectedError();

  const res = await fetch(`${API_BASE}/api/extension/quick-take`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`quick-take failed: ${res.status}`);

  return res.json();
}
