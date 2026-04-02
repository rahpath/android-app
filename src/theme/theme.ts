export const darkColors = {
  backgroundStart: "#f3efe8",
  backgroundEnd: "#d9dde0",
  backgroundAccent: "#e7e1d6",
  primary: "#123765",
  secondary: "#4f6881",
  accentWarm: "#8f7754",
  accentSoft: "#f8f4ee",
  text: "#21324a",
  textMuted: "rgba(33,50,74,0.74)",
  textSoft: "rgba(33,50,74,0.52)",
  glassFill: "rgba(248,244,237,0.84)",
  glassBorder: "rgba(255,255,255,0.74)",
  glow: "rgba(70,102,134,0.22)",
  glowSoft: "rgba(122,145,167,0.18)",
} as const;

export const lightColors = {
  backgroundStart: "#f7f3ec",
  backgroundEnd: "#e3e0d9",
  backgroundAccent: "#ece6db",
  primary: "#123765",
  secondary: "#5a7086",
  accentWarm: "#8f7754",
  accentSoft: "#fffaf2",
  text: "#223248",
  textMuted: "rgba(34,50,72,0.8)",
  textSoft: "rgba(34,50,72,0.56)",
  glassFill: "rgba(249,245,239,0.88)",
  glassBorder: "rgba(255,255,255,0.78)",
  glow: "rgba(85,112,136,0.18)",
  glowSoft: "rgba(111,139,161,0.12)",
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
