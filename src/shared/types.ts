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
}

export interface QuickTakeResponse {
  findings: QuickTakeFinding[];
  subject: string;
}

/** Detection signal from a content script to the background service
    worker — stays entirely local; never sent to the platform. */
export interface DetectionSignal {
  type: "commitment_detected";
  commitmentType: CommitmentType;
  detectedAction: string;
  confidence: "low" | "medium" | "high";
}
