# KnowBefore Extension

The browser thin client from the [MVP Build Plan](../knowbefore-app) — a new front door on the existing KnowBefore platform, not a new product stack. See that plan (Sections 10–13) for the full design and phasing this scaffold follows.

## What's here (Phase 0/1)

- `src/content/` — local, on-device detection only. `commitmentDetector.ts` is sub-scope A (same-document DOM heuristics), `pdfSignal.ts` is sub-scope B (PDF detection by URL/MIME signal, not by reading). Cross-origin embeds (Stripe Checkout, DocuSign) are explicitly out of scope — a content script cannot read them.
- `src/background/` — message routing and the auth bridge (`authBridge.ts` implements step 3 of the connect flow: receiving the scoped token via `externally_connectable`).
- `src/popup/` — the Quick-Take panel, using a duplicated copy of `EvidenceMark` (see the comment in `EvidenceMark.tsx` for why it's copied rather than shared).
- `src/shared/apiClient.ts` — the *only* function in this repo allowed to call the platform. Everything else is local until the user clicks.

## Setup

```bash
npm install
npm run build      # one-off build to dist/
npm run watch       # rebuild on change
npm run typecheck
```

## Load it locally (Phase 0 harness)

1. `npm run build`
2. Chrome → `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select this directory
4. Open `test-pages/subscription-checkout.html` in a tab (or `file://` it directly) — the toolbar icon should badge within a second or two, with no network activity (check the Network tab to confirm).
5. Click the icon → the popup calls `/api/extension/quick-take` on the app. Run `knowbefore-app` locally first (`npm run dev`, port 3000) and connect via `http://localhost:3000/extension/connect`.

## Explicitly not built yet

Silent token refresh, Firefox/Safari support, the Commitment Workspace save flow (Phase 3), and detection beyond sub-scopes A and B. See the Build Plan's Non-Goals (Section 16) and Development Phases (Section 13) before adding anything here.
