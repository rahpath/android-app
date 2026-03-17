export const darkColors = {
  backgroundStart: "#0B0F2A",
  backgroundEnd: "#141A3A",
  backgroundAccent: "#1D2154",
  primary: "#6B7CFF",
  secondary: "#A38BFF",
  accentWarm: "#7FD6FF",
  accentSoft: "#F3D1FF",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.78)",
  textSoft: "rgba(255,255,255,0.58)",
  glassFill: "rgba(255,255,255,0.12)",
  glassBorder: "rgba(255,255,255,0.30)",
  glow: "rgba(163,139,255,0.30)",
  glowSoft: "rgba(127,214,255,0.18)",
} as const;

export const lightColors = {
  backgroundStart: "#293660",
  backgroundEnd: "#4E679E",
  backgroundAccent: "#6A7FBA",
  primary: "#8AA3FF",
  secondary: "#B3A4FF",
  accentWarm: "#AEE8FF",
  accentSoft: "#F7E7FF",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.86)",
  textSoft: "rgba(255,255,255,0.66)",
  glassFill: "rgba(255,255,255,0.24)",
  glassBorder: "rgba(255,255,255,0.42)",
  glow: "rgba(168,190,255,0.28)",
  glowSoft: "rgba(174,232,255,0.22)",
} as const;

export const theme = {
  colors: darkColors,
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    pill: 999,
  },
  typography: {
    h1: 36,
    h2: 24,
    h3: 18,
    h4: 15,
    body: 16,
    caption: 14,
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = Record<keyof typeof darkColors, string>;
