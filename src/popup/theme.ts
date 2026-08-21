/** Single source of truth for the popup's palette — navy + gold,
    matching the brand diamond mark (icons/, popup header, the in-page
    inline prompt in ambientSignal.ts). Pull colors from here instead
    of hardcoding hex values in each component, so the whole popup
    stays one consistent theme instead of drifting screen by screen. */

export const NAVY = "#0b2d4d";
export const NAVY_HOVER = "#123c63";
export const GOLD = "#b5854f";
export const GOLD_LIGHT = "#d4a574"; // for text on navy (header titlebar)
export const GOLD_TINT = "#f6ead9"; // for chip backgrounds on white

export const INK = "#1b2220";
export const INK_MUTED = "#4a5450";
export const INK_FAINT = "#7c8580";
export const RULE = "#ececec";
export const PAPER = "#ffffff";

export const errorText = "#7a3a30";
