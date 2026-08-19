import { useEffect, useState } from "react";
import { EvidenceMark } from "./EvidenceMark";
import { fetchQuickTake, NotConnectedError, SessionExpiredError } from "../shared/apiClient";
import type { QuickTakeRequest, QuickTakeResponse } from "../shared/types";

type Status = "idle" | "loading" | "ready" | "not_connected" | "session_expired" | "error";

/** knowbefore-app's new-decision flow lives at /decisions/new (plural)
    — not /decision/new, which 404s. Prefills the description from
    what the Quick Take already found so the user doesn't have to
    retype what they just read. Full handoff of the findings
    themselves (not just a text summary) is Phase 3 — see Section 8
    of the Build Plan. */
function fullWorkspaceUrl(data: QuickTakeResponse): string {
  const summary = [
    data.subject,
    ...data.findings.slice(0, 3).map((f) => f.claim),
  ].join(". ");
  const params = new URLSearchParams({ description: summary });
  return `http://localhost:3000/decisions/new?${params.toString()}`;
}

/** The compact panel from the MVP Build Plan, Section 7 — optimizes
    for speed, clarity, trust, and actionability, not completeness.
    Deliberately capped at the same 3-5 findings the API route returns. */
export function QuickTakePanel({ request }: { request: QuickTakeRequest }) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<QuickTakeResponse | null>(null);

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
        <a href="http://localhost:3000/extension/connect" target="_blank" rel="noreferrer" style={styles.cta}>
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
      <a href={fullWorkspaceUrl(data)} target="_blank" rel="noreferrer" style={styles.cta}>
        Open full Commitment Workspace →
      </a>
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
    display: "block",
    marginTop: 14,
    padding: "10px 12px",
    background: "#e2ede9",
    color: "#1f6f68",
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: "center",
    textDecoration: "none",
    borderRadius: 6,
  },
};
