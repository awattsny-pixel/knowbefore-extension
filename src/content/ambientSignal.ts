/** Stage 2 from the MVP Build Plan, Section 2 — a purely local,
    non-blocking notice. No network request happens here or anywhere
    else in this file; it only tells the background service worker to
    update the toolbar badge and, optionally, renders one inline line
    near the detected trigger. */

export function showAmbientBadgeSignal(): void {
  if (!chrome.runtime) return; // stale context — see content/index.ts's isContextInvalidated
  chrome.runtime.sendMessage({ type: "SET_BADGE", state: "available" });
}

export function clearAmbientBadgeSignal(): void {
  if (!chrome.runtime) return;
  chrome.runtime.sendMessage({ type: "SET_BADGE", state: "idle" });
}

const INLINE_PROMPT_ID = "knowbefore-inline-prompt";

/** One dismissible line near the trigger element — never a modal.
    "Worth understanding first?" per the friction-reduction discussion
    behind this build. */
export function showInlinePrompt(anchor: Element, onClick: () => void): void {
  if (document.getElementById(INLINE_PROMPT_ID)) return;

  const prompt = document.createElement("div");
  prompt.id = INLINE_PROMPT_ID;
  prompt.setAttribute("role", "button");
  prompt.tabIndex = 0;
  prompt.textContent = "KnowBefore — worth understanding first?";
  prompt.style.cssText = [
    "position: absolute",
    "z-index: 2147483647",
    "font: 12px -apple-system, 'Segoe UI', sans-serif",
    "background: #1f6f68",
    "color: #f2f4f0",
    "padding: 6px 10px",
    "border-radius: 6px",
    "cursor: pointer",
    "box-shadow: 0 4px 12px rgba(0,0,0,0.18)",
  ].join(";");

  const rect = anchor.getBoundingClientRect();
  prompt.style.top = `${window.scrollY + rect.bottom + 6}px`;
  prompt.style.left = `${window.scrollX + rect.left}px`;

  const dismiss = () => prompt.remove();
  prompt.addEventListener("click", () => {
    onClick();
    dismiss();
  });
  window.addEventListener("scroll", dismiss, { once: true, passive: true });

  document.body.appendChild(prompt);
}
