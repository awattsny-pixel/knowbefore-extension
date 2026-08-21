/** The animated brand diamond used everywhere something is loading in
    the popup — same mark/colors as the app's landing page and footer.
    Keyframes (kb-pulse-ring, kb-scan) live in popup.html; SVG proportions
    hold at any render size since strokeWidth/dasharray are in the fixed
    100x100 viewBox, not pixels, so this scales cleanly from a small
    inline spinner up to the full loading-screen size. */
export function LoadingMark({ size = 56 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ position: "absolute", top: 0, left: 0, animation: "kb-pulse-ring 1.8s ease-out infinite" }}
        aria-hidden="true"
      >
        <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="none" stroke="#1f6f68" strokeWidth="4" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M50 10 L90 50 L50 90 L10 50 Z"
          fill="none"
          stroke="#0b2d4d"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M32 51 L45 64 L70 36"
          fill="none"
          stroke="#d4a574"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60"
          style={{ animation: "kb-scan 1.8s ease-in-out infinite" }}
        />
      </svg>
    </div>
  );
}
