import { NAVY, GOLD_LIGHT, INK_MUTED, RULE, PAPER } from "../popup/theme";

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
const INLINE_PROMPT_STYLE_ID = "knowbefore-inline-prompt-style";

/** Injected once per page — arbitrary host pages don't have the
    extension's own stylesheet available, and a content script can't
    reach popup.html's <style> block, so the entrance keyframes for
    the inline prompt live here instead. Namespaced (kb- prefix) to
    stay out of the host page's own CSS. */
function ensurePromptStyle(): void {
  if (document.getElementById(INLINE_PROMPT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = INLINE_PROMPT_STYLE_ID;
  style.textContent = `
    @keyframes kb-inline-prompt-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

/** One dismissible card next to the trigger element — never a modal.
    "Worth understanding first?" per the friction-reduction discussion
    behind this build. Same diamond/checkmark mark and navy/gold/teal
    palette as the rest of the product, rather than a plain color pill,
    so it reads as KnowBefore rather than a generic browser toast.

    Embedded into the page's own layout as a real DOM sibling of the
    trigger button (like a Honey-style inline badge), not an
    absolutely-positioned overlay snapshotted at one scroll position --
    the earlier version disappeared the instant the page scrolled,
    which is backwards for a "read this before you click" prompt: the
    people who scroll to read more are exactly the people this is
    for. Living in the DOM means it scrolls with the page naturally
    and needs no scroll-dismiss listener at all. Falls back to a
    fixed-position overlay only when there's no real element to embed
    next to (anchor is document.body — see triggerFor's fallback). */
export function showInlinePrompt(anchor: Element, onClick: () => void): void {
  if (document.getElementById(INLINE_PROMPT_ID)) return;
  ensurePromptStyle();

  const prompt = document.createElement("div");
  prompt.id = INLINE_PROMPT_ID;
  prompt.setAttribute("role", "button");
  prompt.tabIndex = 0;

  const embedded = anchor !== document.body;
  prompt.style.cssText = [
    embedded ? "position: relative" : "position: fixed",
    ...(embedded ? ["margin-top: 6px"] : ["bottom: 20px", "right: 20px"]),
    "z-index: 2147483647",
    "display: flex",
    "align-items: center",
    "gap: 8px",
    "font-family: -apple-system, 'Segoe UI', sans-serif",
    `background: ${PAPER}`,
    "padding: 8px 12px 8px 8px",
    "border-radius: 10px",
    `border: 1px solid ${RULE}`,
    "cursor: pointer",
    "box-shadow: 0 6px 20px rgba(11,45,77,0.14)",
    "animation: kb-inline-prompt-in 200ms ease-out",
    "width: fit-content",
  ].join(";");

  prompt.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="${NAVY}" stroke-width="5" stroke-linejoin="round" />
      <path d="M32 51 L45 64 L70 36" fill="none" stroke="${GOLD_LIGHT}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span>
      <span style="display:block;font-size:12.5px;font-weight:700;color:${NAVY};line-height:1.3;">KnowBefore</span>
      <span style="display:block;font-size:11.5px;color:${INK_MUTED};line-height:1.3;">Worth understanding first?</span>
    </span>
  `;

  prompt.addEventListener("click", () => {
    onClick();
    prompt.remove();
  });

  if (embedded) {
    anchor.insertAdjacentElement("afterend", prompt);
  } else {
    document.body.appendChild(prompt);
  }
}
