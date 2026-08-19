import type { DetectionSignal } from "../shared/types";

/** Sub-scope B from the MVP Build Plan, Section 10: PDF detection by
    signal, not by reading. Chrome's built-in PDF viewer is a separate
    sandboxed renderer — a content script cannot see its rendered
    content. So this only ever checks the URL/MIME signal and leaves
    text extraction to the backend (reusing the existing document
    ingestion path in knowbefore-app) once the user explicitly
    triggers analysis. */

export function detectPdfContext(): DetectionSignal | null {
  const isPdfUrl = /\.pdf(\?|#|$)/i.test(location.href);
  const isPdfViewer = document.contentType === "application/pdf";

  if (!isPdfUrl && !isPdfViewer) return null;

  return {
    type: "commitment_detected",
    commitmentType: "online_agreement",
    detectedAction: "pdf_document",
    // Medium, not high: we know it's a PDF, but nothing about whether
    // it's actually an agreement — that's for the backend to determine
    // once the user asks for it to be read.
    confidence: "medium",
  };
}
