type SignDefinition = {
  key: string;
  label: string;
  shortLabel: string;
  startDegree: number;
  color: string;
};

export const SIGN_DEFINITIONS: SignDefinition[] = [
  { key: "aries", label: "Aries", shortLabel: "AR", startDegree: 0, color: "#FF8A7A" },
  { key: "taurus", label: "Taurus", shortLabel: "TA", startDegree: 30, color: "#F2C879" },
  { key: "gemini", label: "Gemini", shortLabel: "GE", startDegree: 60, color: "#7FDBB6" },
  { key: "cancer", label: "Cancer", shortLabel: "CA", startDegree: 90, color: "#8DD5FF" },
  { key: "leo", label: "Leo", shortLabel: "LE", startDegree: 120, color: "#FFC46A" },
  { key: "virgo", label: "Virgo", shortLabel: "VI", startDegree: 150, color: "#9FE39A" },
  { key: "libra", label: "Libra", shortLabel: "LI", startDegree: 180, color: "#F8B8D9" },
  { key: "scorpio", label: "Scorpio", shortLabel: "SC", startDegree: 210, color: "#D08BFF" },
  { key: "sagittarius", label: "Sagittarius", shortLabel: "SA", startDegree: 240, color: "#FF9E6D" },
  { key: "capricorn", label: "Capricorn", shortLabel: "CP", startDegree: 270, color: "#B4C1FF" },
  { key: "aquarius", label: "Aquarius", shortLabel: "AQ", startDegree: 300, color: "#7AD8FF" },
  { key: "pisces", label: "Pisces", shortLabel: "PI", startDegree: 330, color: "#9E9BFF" },
];

export const PLANET_SHORT_LABELS: Record<string, string> = {
  sun: "Su",
  moon: "Mo",
  mercury: "Me",
  venus: "Ve",
  mars: "Ma",
  jupiter: "Ju",
  saturn: "Sa",
  uranus: "Ur",
  neptune: "Ne",
  pluto: "Pl",
};

export function normalizeDegree(value: number) {
  const normalized = ((value % 360) + 360) % 360;
  return Number(normalized.toFixed(4));
}

export function getSignFromDegree(value: number) {
  const normalized = normalizeDegree(value);
  const index = Math.floor(normalized / 30) % 12;
  return SIGN_DEFINITIONS[index];
}

export function formatDegreeLabel(value: number) {
  const normalized = normalizeDegree(value);
  const degrees = Math.floor(normalized);
  const minutesFloat = (normalized - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  return `${degrees}° ${minutes}' ${seconds}''`;
}

export function formatDegreeWithinSign(value: number) {
  const normalized = normalizeDegree(value);
  const within = normalized % 30;
  return `${within.toFixed(1)}°`;
}

export function getPlanetShortLabel(key: string) {
  return PLANET_SHORT_LABELS[key.toLowerCase()] ?? key.slice(0, 2).toUpperCase();
}
