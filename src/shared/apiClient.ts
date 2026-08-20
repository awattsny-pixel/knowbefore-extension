import { getStoredToken } from "../storage/extensionStorage";
import type { CategoryExcluded, PurchaseOptionsResponse, QuickTakeRequest, QuickTakeResponse } from "./types";

export const API_BASE = "https://www.knowbefore.ai";

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

/** The "where to buy" call — always a separate request from
    fetchQuickTake, never bundled into it. See the route's own comment
    for why that separation is the point, not an implementation detail. */
export async function fetchPurchaseOptions(
  request: QuickTakeRequest
): Promise<PurchaseOptionsResponse | CategoryExcluded> {
  const token = await getStoredToken();
  if (!token) throw new NotConnectedError();

  const res = await fetch(`${API_BASE}/api/extension/purchase-options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`purchase-options failed: ${res.status}`);

  return res.json();
}

/** State 1 → State 2 (MVP Build Plan, Section 8) — clears the
    ephemeral flag on a decision the quick-take call already wrote.
    No new record; just a flag flip on the existing row. */
export async function saveQuickTake(decisionId: string): Promise<void> {
  const token = await getStoredToken();
  if (!token) throw new NotConnectedError();

  const res = await fetch(`${API_BASE}/api/extension/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ decisionId }),
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
}
