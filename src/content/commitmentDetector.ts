import type { CommitmentType, DetectionSignal } from "../shared/types";

/** Sub-scope A from the MVP Build Plan, Section 10: same-document
    detection only — the top-level document and same-origin iframes
    (manifest sets all_frames: true, which covers same-origin frames
    for free). Cross-origin embeds (Stripe Checkout, DocuSign) are
    explicitly out of scope here — a content script cannot read them;
    that's a browser security boundary, not a gap in this heuristic. */

const TRIGGER_PHRASES = [
  "accept",
  "agree",
  "subscribe",
  "start trial",
  "start free trial",
  "sign",
  "authorize",
  "confirm",
  "place order",
  "continue with purchase",
  "i agree",
];

const SUBSCRIPTION_KEYWORDS = ["subscription", "renews", "renewal", "billed", "trial", "cancel anytime", "recurring"];
const AGREEMENT_KEYWORDS = ["terms of service", "terms and conditions", "agreement", "lease", "employment offer"];

function normalizedText(el: Element): string {
  return (el.textContent || "").trim().toLowerCase();
}

/** Finds the first visible clickable element whose text matches a
    known commitment trigger phrase. Deliberately simple string
    matching — see the plan's "start deterministic and simple" rule
    in Section 10; no ML model runs in the browser. */
function findTriggerElement(): { el: Element; phrase: string } | null {
  const candidates = document.querySelectorAll("button, a, input[type=submit], [role=button]");
  for (const el of candidates) {
    const text = normalizedText(el);
    if (!text || text.length > 60) continue;
    const match = TRIGGER_PHRASES.find((phrase) => text === phrase || text.includes(phrase));
    if (match) return { el, phrase: match };
  }
  return null;
}

function classifyCommitmentType(pageText: string): CommitmentType {
  const lower = pageText.toLowerCase();
  if (SUBSCRIPTION_KEYWORDS.some((k) => lower.includes(k))) return "subscription_terms";
  if (AGREEMENT_KEYWORDS.some((k) => lower.includes(k))) return "online_agreement";
  return "unknown";
}

function confidenceFor(phrase: string, hasNearbyPricing: boolean): DetectionSignal["confidence"] {
  const strongPhrases = ["i agree", "start free trial", "place order", "subscribe"];
  if (strongPhrases.includes(phrase) && hasNearbyPricing) return "high";
  if (strongPhrases.includes(phrase)) return "medium";
  return "low";
}

function hasNearbyPricingLanguage(el: Element): boolean {
  const container = el.closest("form, section, article, div") ?? el.parentElement;
  const text = (container?.textContent || "").toLowerCase();
  return /\$\d|\d+\/(mo|month|yr|year)|price|billed/.test(text);
}

export function runDetection(): DetectionSignal | null {
  const trigger = findTriggerElement();
  if (!trigger) return null;

  const commitmentType = classifyCommitmentType(document.body.textContent || "");
  const confidence = confidenceFor(trigger.phrase, hasNearbyPricingLanguage(trigger.el));

  // Low-confidence, unclassified matches are exactly the "high-annoyance,
  // low-value" case the plan warns against (Section 13, Phase 1) — don't
  // signal on those.
  if (confidence === "low" && commitmentType === "unknown") return null;

  return {
    type: "commitment_detected",
    commitmentType,
    detectedAction: trigger.phrase,
    confidence,
  };
}
