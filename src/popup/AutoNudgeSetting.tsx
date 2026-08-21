import { useEffect, useState } from "react";
import { getAutoNudgeEnabled, setAutoNudgeEnabled } from "../storage/extensionStorage";

/** Opt-in toggle for the in-page inline prompt (content/ambientSignal.ts).
    Off by default — see extensionStorage.getAutoNudgeEnabled for why this
    only changes when the "worth understanding first?" prompt appears,
    never whether a click is still required to actually run an analysis. */
export function AutoNudgeSetting() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    getAutoNudgeEnabled().then(setEnabled);
  }, []);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    await setAutoNudgeEnabled(next);
  }

  if (enabled === null) return null;

  return (
    <label style={styles.row}>
      <input type="checkbox" checked={enabled} onChange={toggle} style={styles.checkbox} />
      <span style={styles.text}>
        Show a nudge on the page when KnowBefore notices a commitment, instead of only the
        toolbar badge
      </span>
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid #d7ddd6",
    cursor: "pointer",
  },
  checkbox: { marginTop: 2, flexShrink: 0 },
  text: { fontSize: 11.5, lineHeight: 1.4, color: "#7c8580" },
};
