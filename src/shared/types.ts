/** Mirrors src/lib/types.ts's DecisionVariable evidence states and
    src/components/canvas/EvidenceMark.tsx in the knowbefore-app repo.
    Duplicated here deliberately — see the MVP Build Plan, Section 12:
    at this size a shared package buys nothing a copy-paste doesn't,
    and it avoids standing up monorepo tooling for one small type. */
export type EvidenceState = "confirmed" | "inferred" | "assumed" | "unknown";

export interface QuickTakeFinding {
  claim: string;
  state: EvidenceState;
  source: string | null;
  explanation: string;
}

export type CommitmentType =
  | "subscription_terms"
  | "online_agreement"
  | "recurring_commitment"
  | "unknown";

/** The payload a content script assembles after the user clicks —
    never before. See Section 4 of the MVP Build Plan. */
export interface QuickTakeRequest {
  pageUrl: string;
  pageTitle: string;
  commitmentType: CommitmentType;
  /** Visible agreement/terms/pricing text near the detected action —
      not the whole page. See the "collect what's necessary, not
      everything available" rule in Section 4. */
  relevantText: string;
  detectedAction: string | null;
  /** Local checkout-flag detections for this page, if any -- see
      checkoutSignals.ts. Only included when the user has already
      opened Quick Take, same as everything else in this request. */
  checkoutFlags?: CheckoutFlag[];
}

export interface SubscriptionsSummaryResponse {
  count: number;
  monthlyTotalCents: number;
  currency: string;
}

export interface QuickTakeResponse {
  findings: QuickTakeFinding[];
  subject: string;
  /** The ephemeral decision row the server wrote for this Quick Take
      (Section 8, State 1) — null if persistence failed server-side,
      in which case the findings above still render, there's just
      nothing to Save. See /api/extension/save. */
  decisionId: string | null;
}

/** Mirrors knowbefore-app's ProductOption + find-products shape. No
    EvidenceState here — these aren't evidentiary claims, they're named
    purchase alternatives, disclosed and ranked by fit, never by
    commission. See Appendix B, "Equal-prominence rule": affiliate
    status never re-orders this list. */
export interface PurchaseOption {
  name: string;
  price_estimate: string | null;
  key_stat: string | null;
  best_for: string | null;
  url: string | null;
  why_it_fits: string;
  pros: string[];
  cons: string[];
}

export interface PurchaseOptionsResponse {
  products: PurchaseOption[];
  comparison_points: string[];
}

/** Returned instead of PurchaseOptionsResponse when the category
    boundary (Appendix B) excludes the request — agreement/contract
    review never gets purchase options, by policy, enforced
    server-side regardless of what the client sends. */
export interface CategoryExcluded {
  excluded: true;
}

/** Detection signal from a content script to the background service
    worker — stays entirely local; never sent to the platform. */
export interface DetectionSignal {
  type: "commitment_detected";
  commitmentType: CommitmentType;
  detectedAction: string;
  confidence: "low" | "medium" | "high";
}

/** A single dark-pattern signal found in the checkout DOM itself --
    entirely local, entirely deterministic (regex/DOM queries, no ML,
    no network call). Reuses EvidenceState rather than a parallel
    confidence taxonomy: "confirmed" for things read directly off the
    page (a checkbox's actual .checked value, stated renewal text),
    "assumed" for a pattern that's suggestive but not stated outright
    (a countdown timer, a trial with no visible charge date). */
export type CheckoutFlagKind =
  | "prechecked_addon"
  | "auto_renewal"
  | "trial_to_paid"
  | "urgency_pattern";

export interface CheckoutFlag {
  kind: CheckoutFlagKind;
  state: EvidenceState;
  /** Short, plain-English line for the anchored panel, e.g.
      "This renews at $49/mo starting Nov 5." */
  label: string;
  /** Optional structured details surfaced in the label/tooltip --
      not sent anywhere, just what the detector actually found. */
  amount?: string;
  date?: string;
}
