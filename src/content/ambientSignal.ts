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

/** One dismissible card near the trigger element — never a modal.
    "Worth understanding first?" per the friction-reduction discussion
    behind this build. Same diamond/checkmark mark and navy/gold/teal
    palette as the rest of the product, rather than a plain color pill,
    so it reads as KnowBefore rather than a generic browser toast. */
export function showInlinePrompt(anchor: Element, onClick: () => void): void {
  if (document.getElementById(INLINE_PROMPT_ID)) return;
  ensurePromptStyle();

  const prompt = document.createElement("div");
  prompt.id = INLINE_PROMPT_ID;
  prompt.setAttribute("role", "button");
  prompt.tabIndex = 0;
  prompt.style.cssText = [
    "position: absolute",
    "z-index: 2147483647",
    "display: flex",
    "align-items: center",
    "gap: 8px",
    "font-family: -apple-system, 'Segoe UI', sans-serif",
    "background: #ffffff",
    "padding: 8px 12px 8px 8px",
    "border-radius: 10px",
    "border: 1px solid #d7ddd6",
    "cursor: pointer",
    "box-shadow: 0 6px 20px rgba(11,45,77,0.14)",
    "animation: kb-inline-prompt-in 200ms ease-out",
  ].join(";");

  prompt.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="#0b2d4d" stroke-width="5" stroke-linejoin="round" />
      <path d="M32 51 L45 64 L70 36" fill="none" stroke="#d4a574" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span>
      <span style="display:block;font-size:12.5px;font-weight:700;color:#0b2d4d;line-height:1.3;">KnowBefore</span>
      <span style="display:block;font-size:11.5px;color:#4a5450;line-height:1.3;">Worth understanding first?</span>
    </span>
  `;

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
