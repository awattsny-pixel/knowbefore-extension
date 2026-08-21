import { useEffect, useState, type CSSProperties } from "react";
import { fetchPurchaseOptions } from "../shared/apiClient";
import { LoadingMark } from "./LoadingMark";
import { NAVY, GOLD, GOLD_TINT, INK, INK_MUTED, INK_FAINT, RULE, PAPER } from "./theme";
import type { PurchaseOption, QuickTakeRequest } from "../shared/types";

type Status = "loading" | "ready" | "excluded" | "empty" | "error";

/** The "where to buy" zone — always rendered below and visually
    distinct from the evidence findings in QuickTakePanel, never
    interleaved with them. That separation is Appendix B's firewall
    made visible in the actual layout: "why this option" and "buy this
    option" must never look like the same claim.

    Ranked by fit only (see the route's system prompt) — commission is
    uniform across every option shown, so there's no reason to reorder
    by anything else. The disclosure line below states this plainly,
    as a fact worth knowing, not a footnote. */
export function PurchaseComparisonView({ request }: { request: QuickTakeRequest }) {
  const [status, setStatus] = useState<Status>("loading");
  const [products, setProducts] = useState<PurchaseOption[]>([]);
  const [comparisonPoints, setComparisonPoints] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchPurchaseOptions(request)
      .then((res) => {
        if (cancelled) return;
        if ("excluded" in res) {
          setStatus("excluded");
          return;
        }
        if (!res.products || res.products.length === 0) {
          setStatus("empty");
          return;
        }
        setProducts(res.products);
        setComparisonPoints(res.comparison_points ?? []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent, not an error state shown to the user — an agreement page
  // simply never gets a purchase-comparison zone. See the category
  // boundary, Appendix B.
  if (status === "excluded" || status === "empty" || status === "error") return null;

  return (
    <div style={styles.zone}>
      <div style={styles.divider} />
      <p style={styles.title}>Compare options</p>

      {status === "loading" ? (
        <div style={styles.loadingRow}>
          <LoadingMark size={22} />
          <p style={styles.muted}>Finding real alternatives…</p>
        </div>
      ) : (
        <>
          {comparisonPoints.length > 0 && (
            <ul style={styles.compareList}>
              {comparisonPoints.map((point) => (
                <li key={point} style={styles.compareItem}>
                  {point}
                </li>
              ))}
            </ul>
          )}

          <div style={styles.cards}>
            {products.map((p) => (
              <div key={p.name} style={styles.card}>
                {p.best_for && <p style={styles.bestFor}>{p.best_for}</p>}
                <p style={styles.name}>{p.name}</p>
                <div style={styles.priceRow}>
                  {p.price_estimate && <span style={styles.price}>{p.price_estimate}</span>}
                  {p.key_stat && <span style={styles.keyStat}>{p.key_stat}</span>}
                </div>
                <p style={styles.whyFits}>{p.why_it_fits}</p>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" style={styles.buyLink}>
                    View &amp; buy →
                  </a>
                )}
              </div>
            ))}
          </div>

          <p style={styles.disclosure}>
            Same commission on every option shown — we don&apos;t earn more if you pick one over
            another.
          </p>
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  zone: { marginTop: 4 },
  divider: { height: 1, background: RULE, margin: "4px 0 14px" },
  title: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: INK_FAINT,
    margin: "0 0 10px",
  },
  muted: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 12,
    color: INK_MUTED,
    margin: 0,
  },
  loadingRow: { display: "flex", alignItems: "center", gap: 8 },
  compareList: { margin: "0 0 12px", padding: "0 0 0 16px" },
  compareItem: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 12,
    lineHeight: 1.5,
    color: INK,
    marginBottom: 4,
  },
  cards: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    border: `1px solid ${RULE}`,
    borderRadius: 8,
    padding: "10px 12px",
    background: PAPER,
    boxShadow: "0 1px 3px rgba(11,45,77,0.06)",
  },
  bestFor: {
    display: "inline-block",
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: NAVY,
    background: GOLD_TINT,
    borderRadius: 999,
    padding: "2px 8px",
    marginBottom: 6,
  },
  name: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    margin: "0 0 3px",
  },
  priceRow: { display: "flex", gap: 8, alignItems: "baseline", marginBottom: 5 },
  price: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: GOLD,
  },
  keyStat: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 11,
    color: INK_FAINT,
  },
  whyFits: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 12,
    lineHeight: 1.4,
    color: INK_MUTED,
    margin: "0 0 6px",
  },
  buyLink: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: NAVY,
    textDecoration: "none",
  },
  disclosure: {
    fontFamily: "-apple-system, 'Segoe UI', sans-serif",
    fontSize: 10.5,
    fontStyle: "italic",
    color: INK_FAINT,
    margin: "12px 0 0",
    lineHeight: 1.4,
  },
};
