import type { CheckoutFlag } from "../shared/types";

/** Pre-checkout dark-pattern signals — narrow, high-precision DOM
    detectors that run only once a checkout-intent trigger has already
    fired (see content/index.ts), not on every page. Everything here
    is regex/DOM inspection against what's already rendered; nothing
    is sent anywhere and no ML model runs — same "start deterministic
    and simple" rule as commitmentDetector.ts.

    Deliberately v1-scoped per the spec: cancellation-asymmetry (which
    needs a cross-domain cached lookup table -- infrastructure that
    doesn't exist yet) is out, as is any live cancellation-flow
    testing. Four detectors only. */

const PRICE_PATTERN = /\$\s?\d[\d,]*(\.\d{2})?/;
const DATE_PATTERN =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?(,?\s+\d{4})?\b|\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/i;

function nearestText(el: Element, maxChars = 400): string {
  const container = el.closest("form, section, article, li, div") ?? el.parentElement ?? el;
  return (container.textContent || "").trim().slice(0, maxChars);
}

/** 1. Pre-checked boxes that add cost -- the one detector that's
    fully unambiguous: .checked is either true or it isn't, no
    inference involved, so this is always "confirmed". */
function detectPrecheckedAddons(): CheckoutFlag[] {
  const flags: CheckoutFlag[] = [];
  const boxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

  for (const box of boxes) {
    if (!box.checked) continue;
    const label =
      (box.labels && box.labels[0]?.textContent) ||
      box.closest("label")?.textContent ||
      box.getAttribute("aria-label") ||
      "";
    const text = label.toLowerCase();
    const looksLikeCostAddon =
      /\$\d|add[- ]?on|protect|insurance|warranty|coverage/.test(text) && text.trim().length > 0;
    if (!looksLikeCostAddon) continue;

    const priceMatch = label.match(PRICE_PATTERN);
    flags.push({
      kind: "prechecked_addon",
      state: "confirmed",
      label: priceMatch
        ? `"${label.trim().slice(0, 60)}" is pre-selected (+${priceMatch[0]}).`
        : `"${label.trim().slice(0, 60)}" is pre-selected.`,
      amount: priceMatch?.[0],
    });
  }

  return flags;
}

/** 2. Auto-renewal / recurring billing language stated on the page.
    "Confirmed" -- this is the page's own words, not an inference. */
function detectAutoRenewal(): CheckoutFlag[] {
  const bodyText = document.body.innerText || "";
  const renewalPhrase =
    /renews? automatically|auto-renew(s|al)?|recurring (billing|charge|payment)|unless (you |)cancell?ed/i;
  const match = bodyText.match(renewalPhrase);
  if (!match) return [];

  const idx = bodyText.indexOf(match[0]);
  const window = bodyText.slice(Math.max(0, idx - 120), idx + 120);
  const amount = window.match(PRICE_PATTERN)?.[0];
  const date = window.match(DATE_PATTERN)?.[0];

  const label = amount && date
    ? `This renews at ${amount} starting ${date}.`
    : amount
      ? `This renews automatically at ${amount}.`
      : `This renews automatically — the page doesn't say when or for how much.`;

  return [{ kind: "auto_renewal", state: "confirmed", label, amount, date }];
}

/** 3. Free trial + card-collection on the same page -- the
    highest-value combo per the spec. "Confirmed" only if a post-trial
    price is actually stated; "assumed" (with an explicit note) if the
    charge date/amount is missing, since a trial with no visible
    charge terms is itself the dark pattern being flagged. */
function detectTrialToPaid(): CheckoutFlag[] {
  const bodyText = document.body.innerText || "";
  const hasTrialLanguage = /free trial/i.test(bodyText);
  const hasCardField = !!document.querySelector(
    'input[autocomplete*="cc-number"], input[autocomplete*="cc-"], input[name*="card"], input[id*="card-number"]'
  );
  if (!hasTrialLanguage || !hasCardField) return [];

  const idx = bodyText.search(/free trial/i);
  const window = bodyText.slice(Math.max(0, idx - 100), idx + 300);
  const amount = window.match(PRICE_PATTERN)?.[0];
  const date = window.match(DATE_PATTERN)?.[0];

  if (amount && date) {
    return [{
      kind: "trial_to_paid",
      state: "confirmed",
      label: `Free trial converts to ${amount} on ${date}.`,
      amount, date,
    }];
  }

  return [{
    kind: "trial_to_paid",
    state: "assumed",
    label: "This is a free trial that collects a card up front — the page doesn't clearly state when or how much you'll be charged.",
  }];
}

/** 4. Countdown timers + scarcity language -- lower-confidence by
    design, always "assumed": a live-updating element paired with
    urgency wording is suggestive of artificial urgency, not proof of
    it (some countdowns are real, e.g. an actual flash sale). */
function detectUrgencyPatterns(): CheckoutFlag[] {
  const timerEl = document.querySelector(
    '[class*="countdown"], [class*="timer"], [data-countdown], [id*="countdown"]'
  );
  if (!timerEl) return [];

  const scarcityPhrase = /only \d+ left|offer ends|hurry|almost gone|selling fast|limited time/i;
  const nearby = nearestText(timerEl, 200);
  if (!scarcityPhrase.test(nearby)) return [];

  return [{
    kind: "urgency_pattern",
    state: "assumed",
    label: "A countdown timer paired with urgency language — worth checking whether the deadline is real.",
  }];
}

/** Best-effort DOM anchor for a price on the page -- used to embed
    the checkout-flag panel next to an actual price the way a
    Honey-style badge sits next to Amazon's price, rather than next to
    whatever button happened to trigger detection. Picks the first
    short, leaf-level element whose own text is just a price (not a
    paragraph that happens to contain one), which in practice matches
    the dedicated price element on most checkout/product pages. Null
    if nothing matches -- callers fall back to the trigger anchor. */
export function findPriceAnchor(): Element | null {
  const candidates = document.querySelectorAll("span, div, td, strong, b, p");
  for (const el of candidates) {
    if (el.children.length > 0) continue; // leaf nodes only -- skip containers
    const text = (el.textContent || "").trim();
    if (text.length > 0 && text.length <= 12 && PRICE_PATTERN.test(text)) return el;
  }
  return null;
}

/** Runs all four detectors and returns whatever they found, most
    important first (trial-to-paid and auto-renewal are the two the
    spec calls highest-value; pre-checked and urgency follow). Caps at
    3 flags to keep the anchored panel short -- this is a glanceable
    interrupt-avoider, not a report. */
export function extractCheckoutFlags(): CheckoutFlag[] {
  const flags = [
    ...detectTrialToPaid(),
    ...detectAutoRenewal(),
    ...detectPrecheckedAddons(),
    ...detectUrgencyPatterns(),
  ];
  return flags.slice(0, 3);
}
