export const darkColors = {
  backgroundStart: "#050507",
  backgroundEnd: "#121218",
  backgroundAccent: "#1A1527",
  primary: "#7C5CFF",
  secondary: "#B79CFF",
  accentWarm: "#9B7BFF",
  accentSoft: "#E2D9FF",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.74)",
  textSoft: "rgba(255,255,255,0.48)",
  glassFill: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(190,166,255,0.16)",
  glow: "rgba(124,92,255,0.34)",
  glowSoft: "rgba(183,156,255,0.16)",
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
    xs: 6,
    sm: 12,
    md: 18,
    lg: 28,
    xl: 40,
  },
  radius: {
    sm: 14,
    md: 18,
    lg: 24,
    pill: 999,
  },
  typography: {
    h1: 42,
    h2: 30,
    h3: 20,
    h4: 15,
    body: 15,
    caption: 13,
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = Record<keyof typeof darkColors, string>;
