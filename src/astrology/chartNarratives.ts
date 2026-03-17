import type { ChartAspect, NatalChart, PlanetPlacement } from "@/types/domain";

const signTone: Record<string, string> = {
  Aries: "meets life through bold first instincts and fast emotional ignition",
  Taurus: "needs steadiness, embodiment, and proof before opening fully",
  Gemini: "processes everything by linking patterns, words, and possibilities",
  Cancer: "moves through life with memory, sensitivity, and a strong inner tide",
  Leo: "wants to express from the heart and feel fully seen in doing so",
  Virgo: "tracks what is off, what can improve, and how to regain inner order",
  Libra: "learns through mirrors, relationships, and the search for balance",
  Scorpio: "goes deep fast and tends to feel transformation as a lived necessity",
  Sagittarius: "needs spaciousness, meaning, and room for the story to expand",
  Capricorn: "orients through structure, responsibility, and earned trust",
  Aquarius: "steps back to see the larger pattern before choosing where to attach",
  Pisces: "absorbs subtle feeling and often experiences life through intuition first",
};

function placementText(placement: PlanetPlacement | null, fallback: string) {
  if (!placement) {
    return fallback;
  }

  return `${placement.label} in ${placement.signLabel} ${signTone[placement.signLabel] || "carries its own distinct tone"}.`;
}

function findAspect(chart: NatalChart, planetA: string, planetB: string) {
  return chart.aspects.find(
    (aspect) =>
      (aspect.fromKey === planetA && aspect.toKey === planetB)
      || (aspect.fromKey === planetB && aspect.toKey === planetA),
  );
}

function aspectText(aspect: ChartAspect | undefined, fallback: string) {
  if (!aspect) {
    return fallback;
  }

  return `${aspect.fromLabel} ${aspect.aspectLabel.toLowerCase()} ${aspect.toLabel} with an orb of ${aspect.orb.toFixed(1)}°, which is one of the stronger shaping tensions Rah is tracking in your chart.`;
}

export function getChartConfidenceText(chart: NatalChart) {
  return chart.accuracy === "full_time"
    ? "Birth time is present, so Rah can read sign, rising, and house structure with more confidence."
    : "Birth time is missing, so Rah is keeping house and rising-based claims softer while still reading sign placements seriously.";
}

export function getChartMeaningCards(chart: NatalChart) {
  const sun = chart.corePlacements.sun;
  const moon = chart.corePlacements.moon;
  const venus = chart.placements.find((placement) => placement.key === "venus") ?? null;
  const saturn = chart.placements.find((placement) => placement.key === "saturn") ?? null;
  const sunMoonAspect = findAspect(chart, "sun", "moon");
  const venusSaturnAspect = findAspect(chart, "venus", "saturn");

  return [
    {
      eyebrow: "Emotional Style",
      title: moon ? `Your Moon in ${moon.signLabel}` : "Your emotional style",
      content: placementText(
        moon,
        "Rah still needs a little more chart certainty before naming your emotional style.",
      ),
    },
    {
      eyebrow: "Relationship Pattern",
      title: venus ? `How you tend to attach` : "How you relate",
      content: `${placementText(
        venus,
        "Rah is still mapping the relational tone of your chart.",
      )} ${aspectText(
        venusSaturnAspect,
        "One of the things Rah will keep watching is how closeness and self-protection interact in your chart.",
      )}`,
    },
    {
      eyebrow: "Decision Wiring",
      title: sun ? `How you move through major choices` : "How you move through choice",
      content: `${placementText(
        sun,
        "Rah is still shaping the identity signature behind your decisions.",
      )} ${aspectText(
        sunMoonAspect,
        "Your chart suggests decisions become clearest when inner feeling and outer identity stop pulling in opposite directions.",
      )}`,
    },
    {
      eyebrow: "Pressure Point",
      title: saturn ? `Where life asks for maturity` : "Where pressure teaches you",
      content: placementText(
        saturn,
        "Rah is still looking for the chart point that describes your deeper growth pressure.",
      ),
    },
  ];
}

export function getTopAspectCards(chart: NatalChart) {
  return chart.aspects.slice(0, 4).map((aspect) => ({
    title: `${aspect.fromLabel} ${aspect.aspectLabel} ${aspect.toLabel}`,
    content: `This aspect links ${aspect.fromLabel.toLowerCase()} and ${aspect.toLabel.toLowerCase()} in a way that Rah treats as part of your deeper pattern architecture. Orb: ${aspect.orb.toFixed(1)}°.`,
  }));
}

export function getFeatureAstrologyLens(
  chart: NatalChart | null,
  feature: "relationships" | "career" | "patterns",
) {
  if (!chart) {
    return {
      title: "Chart lens still loading",
      content: "Rah needs your chart to fully weave astrology into this part of the app.",
    };
  }

  const moon = chart.corePlacements.moon;
  const sun = chart.corePlacements.sun;
  const venus = chart.placements.find((placement) => placement.key === "venus") ?? null;
  const mars = chart.placements.find((placement) => placement.key === "mars") ?? null;
  const saturn = chart.placements.find((placement) => placement.key === "saturn") ?? null;

  if (feature === "relationships") {
    return {
      title: venus ? `Relationships through ${venus.signLabel} Venus` : "Relationships through your chart",
      content: `${placementText(
        venus,
        "Rah is still tracing the relational center of your chart.",
      )} ${placementText(
        moon,
        "Your emotional style will matter a lot in how closeness feels.",
      )}`,
    };
  }

  if (feature === "career") {
    return {
      title: sun ? `Direction through ${sun.signLabel} Sun` : "Direction through your chart",
      content: `${placementText(
        sun,
        "Rah is still shaping how your identity meets purpose.",
      )} ${placementText(
        saturn,
        "Your chart pressure point will matter in career decisions.",
      )}`,
    };
  }

  return {
    title: moon ? `Patterns through ${moon.signLabel} Moon` : "Patterns through your chart",
    content: `${placementText(
      moon,
      "Rah is still tracing the emotional pattern core in your chart.",
    )} ${placementText(
      mars,
      "Your action style is also part of the loop Rah is watching.",
    )}`,
  };
}
