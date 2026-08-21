import { createRoot } from "react-dom/client";
import { QuickTakePanel } from "./QuickTakePanel";
import { AutoNudgeSetting } from "./AutoNudgeSetting";
import type { QuickTakeRequest } from "../shared/types";
import { getLastDetection } from "../storage/extensionStorage";

/** Assembles the request from the active tab's page — see Section 4,
    Context Collection: only what's necessary, gathered fresh right
    now, never from a passively-cached copy of the page. commitmentType
    comes from the content script's own detection (stored by the
    service worker, keyed by tab) — the popup has no detector of its
    own, and defaults to "unknown" only if no detection was ever
    recorded for this tab (e.g. the user opened the popup manually
    before any signal fired). */
async function buildRequest(): Promise<QuickTakeRequest> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [injection, detection] = await Promise.all([
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => ({
        title: document.title,
        text: document.body.innerText.slice(0, 8000),
      }),
    }),
    tab.id != null ? getLastDetection(tab.id) : Promise.resolve(null),
  ]);
  const result = injection[0]?.result ?? { title: tab.title ?? "", text: "" };

  return {
    pageUrl: tab.url ?? "",
    pageTitle: result.title,
    commitmentType: detection?.commitmentType ?? "unknown",
    relevantText: result.text,
    detectedAction: detection?.detectedAction ?? null,
  };
}

async function main() {
  const root = createRoot(document.getElementById("root")!);
  const request = await buildRequest();
  root.render(
    <div style={{ width: 320 }}>
      <QuickTakePanel request={request} />
      <AutoNudgeSetting />
    </div>
  );
}

main();
