import { createRoot } from "react-dom/client";
import { QuickTakePanel } from "./QuickTakePanel";
import type { CommitmentType, QuickTakeRequest } from "../shared/types";

/** Assembles the request from the active tab's page — see Section 4,
    Context Collection: only what's necessary, gathered fresh right
    now, never from a passively-cached copy of the page. */
async function buildRequest(): Promise<QuickTakeRequest> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: () => ({
      title: document.title,
      text: document.body.innerText.slice(0, 8000),
    }),
  });
  const result = injection?.result ?? { title: tab.title ?? "", text: "" };

  return {
    pageUrl: tab.url ?? "",
    pageTitle: result.title,
    commitmentType: "unknown" as CommitmentType,
    relevantText: result.text,
    detectedAction: null,
  };
}

async function main() {
  const root = createRoot(document.getElementById("root")!);
  const request = await buildRequest();
  root.render(<QuickTakePanel request={request} />);
}

main();
