import { useEffect, useState } from "react";
import { EvidenceMark } from "./EvidenceMark";
import { PurchaseComparisonView } from "./PurchaseComparisonView";
import { API_BASE, fetchQuickTake, saveQuickTake, NotConnectedError, SessionExpiredError } from "../shared/apiClient";
import type { QuickTakeRequest, QuickTakeResponse } from "../shared/types";

type Status = "idle" | "loading" | "ready" | "not_connected" | "session_expired" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Points at the real ephemeral decision quick-take already wrote
    (Section 8, State 1) — /decision/[id]/canvas, not /decisions/new.
    Falls back to the old prefilled-description flow only if server-
    side persistence failed for this particular Quick Take (data.
    decisionId is null) and there's genuinely nothing to open yet. */
function fullWorkspaceUrl(data: QuickTakeResponse): string {
  if (data.decisionId) {
    return `${API_BASE}/decision/${data.decisionId}/canvas`;
  }
  const summary = [
    data.subject,
    ...data.findings.slice(0, 3).map((f) => f.claim),
  ].join(". ");
  const params = new URLSearchParams({ description: summary });
  return `${API_BASE}/decisions/new?${params.toString()}`;
}

/** The compact panel from the MVP Build Plan, Section 7 — optimizes
    for speed, clarity, trust, and actionability, not completeness.
    Deliberately capped at the same 3-5 findings the API route returns. */
export function QuickTakePanel({ request }: { request: QuickTakeRequest }) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<QuickTakeResponse | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  async function handleSave(decisionId: string) {
    setSaveStatus("saving");
    try {
      await saveQuickTake(decisionId);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  // Both explicit Save and "Open Full Commitment Workspace" move this
  // out of the ephemeral state (Section 8) — the plan names them as
  // equally valid ways to do it. Saves first, then opens the tab, so
  // there's no window where the tab is open on a row that's still
  // technically ephemeral.
  async function handleOpenWorkspace(url: string, decisionId: string | null) {
    if (decisionId && saveStatus !== "saved") {
      await handleSave(decisionId);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    fetchQuickTake(request)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof NotConnectedError) setStatus("not_connected");
        else if (err instanceof SessionExpiredError) setStatus("session_expired");
        else setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "not_connected" || status === "session_expired") {
    return (
      <div style={styles.panel}>
        <p style={styles.title}>
          {status === "not_connected" ? "Connect your KnowBefore account" : "Reconnect KnowBefore"}
        </p>
        <p style={styles.muted}>
          {status === "not_connected"
            ? "You'll only need to do this once."
            : "Your session expired — this happens after a while for your security."}
        </p>
        <a href={`${API_BASE}/extension/connect`} target="_blank" rel="noreferrer" style={styles.cta}>
          {status === "not_connected" ? "Connect" : "Reconnect"} →
        </a>
      </div>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <div style={styles.panel}>
        <p style={styles.muted}>Reading what matters…</p>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div style={styles.panel}>
        <p style={styles.muted}>Couldn't complete that analysis. Try again in a moment.</p>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <p style={styles.titlebar}>KNOWBEFORE — QUICK TAKE</p>
      <p style={styles.title}>{data.subject}</p>
      {data.findings.slice(0, 5).map((f, i) => (
        <div key={i} style={styles.row}>
          <EvidenceMark state={f.state} size={15} />
          <p style={styles.rowText}>{f.claim}</p>
        </div>
      ))}

      {/* Its own zone, always after the findings — never interleaved
          with them. See PurchaseComparisonView's own comment for why
          that ordering is Appendix B's firewall, not just a layout
          choice. Renders nothing at all on excluded/empty/error. */}
      <PurchaseComparisonView request={request} />

      <div style={styles.actions}>
        {data.decisionId && (
          <button
            type="button"
            onClick={() => handleSave(data.decisionId!)}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            style={styles.saveButton}
          >
            {saveStatus === "saved" ? "Saved ✓" : saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
        )}
        <button
          type="button"
          onClick={() => handleOpenWorkspace(fullWorkspaceUrl(data), data.decisionId)}
          style={styles.cta}
        >
          Open full Commitment Workspace →
        </button>
      </div>
      {saveStatus === "error" && (
        <p style={styles.saveError}>Couldn&apos;t save — try again in a moment.</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { width: 320, fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: "#1b2220" },
  titlebar: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#7c8580", margin: "0 0 8px" },
  title: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  muted: { fontSize: 12.5, color: "#4a5450", margin: 0 },
  row: { display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid #d7ddd6" },
  rowText: { fontSize: 12.5, lineHeight: 1.4, margin: 0 },
  cta: {
    flex: 1,
    display: "block",
    padding: "10px 12px",
    background: "#e2ede9",
    color: "#1f6f68",
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: "center",
    textDecoration: "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  actions: { display: "flex", gap: 8, marginTop: 14 },
  saveButton: {
    padding: "10px 14px",
    background: "#ffffff",
    color: "#1f6f68",
    border: "1px solid #1f6f68",
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  saveError: { fontSize: 11, color: "#7a3a30", margin: "6px 0 0" },
};
