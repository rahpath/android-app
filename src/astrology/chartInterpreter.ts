import { buildLiveTransitSnapshot } from "@/astrology/transitEngine";
import type { AstrologySignal, NatalChart, MemoryEvent } from "@/types/domain";

const SIGN_MEANINGS: Record<string, string> = {
  Aries: "you process life through action, urgency, and direct instinct",
  Taurus: "you process life through steadiness, embodiment, and emotional grounding",
  Gemini: "you process life through pattern-linking, words, and quick shifts in perspective",
  Cancer: "you process life through sensitivity, memory, and emotional protection",
  Leo: "you process life through creative courage, visibility, and heart-led expression",
  Virgo: "you process life through discernment, detail, and the urge to improve what feels off",
  Libra: "you process life through relationship mirrors, balance, and meaning made with others",
  Scorpio: "you process life through intensity, emotional depth, and transformation",
  Sagittarius: "you process life through freedom, perspective, and future-facing meaning",
  Capricorn: "you process life through structure, ambition, and long-range responsibility",
  Aquarius: "you process life through detachment, innovation, and big-picture pattern recognition",
  Pisces: "you process life through intuition, feeling, and porous emotional awareness",
};

const today = () => new Date().toISOString().slice(0, 10);

export function buildNatalChartSummary(chart: NatalChart) {
  const parts = [
    chart.corePlacements.sun
      ? `Your core identity carries ${chart.corePlacements.sun.signLabel} themes, which means ${SIGN_MEANINGS[chart.corePlacements.sun.signLabel]}.`
      : null,
    chart.corePlacements.moon
      ? `Emotionally, your Moon in ${chart.corePlacements.moon.signLabel} suggests ${SIGN_MEANINGS[chart.corePlacements.moon.signLabel]}.`
      : null,
    chart.corePlacements.rising
      ? `The world meets you through a ${chart.corePlacements.rising.signLabel} rising signature.`
      : "Birth time is still missing, so Rah is holding back from claiming your rising sign or houses with certainty.",
  ].filter(Boolean);

  return parts.join(" ");
}

export function buildChartBackedSignals(chart: NatalChart, memoryEvents: MemoryEvent[]): AstrologySignal[] {
  const transit = buildLiveTransitSnapshot();
  const focusMemory = memoryEvents[0];
  const memoryContext = focusMemory
    ? ` Current life focus is leaning toward ${focusMemory.type.replace(/_/g, " ")} themes.`
    : "";

  const signals: AstrologySignal[] = [];

  if (chart.corePlacements.sun) {
    signals.push({
      planet: "Sun",
      signalType: `${chart.corePlacements.sun.signLabel} identity lens`,
      description:
        `${SIGN_MEANINGS[chart.corePlacements.sun.signLabel]}. ${transit.sunSign} season is currently coloring how visible this feels.` +
        memoryContext,
      strength: 0.82,
      date: today(),
      relatedPlacement: `${chart.corePlacements.sun.label} in ${chart.corePlacements.sun.signLabel}`,
    });
  }

  if (chart.corePlacements.moon) {
    signals.push({
      planet: "Moon",
      signalType: `${transit.moonPhase.label} emotional weather`,
      description:
        `Your Moon sits in ${chart.corePlacements.moon.signLabel}, so emotions often move through a ${chart.corePlacements.moon.signLabel.toLowerCase()} style of processing. Today's Moon is in ${transit.moonSign}, adding a ${transit.moonPhase.label} atmosphere.` +
        memoryContext,
      strength: 0.9,
      date: today(),
      relatedPlacement: `${chart.corePlacements.moon.label} in ${chart.corePlacements.moon.signLabel}`,
    });
  }

  if (chart.corePlacements.rising) {
    signals.push({
      planet: "Ascendant",
      signalType: `${chart.corePlacements.rising.signLabel} outward rhythm`,
      description:
        `Your rising sign shapes the way people first read your energy. ${chart.corePlacements.rising.signLabel} rising brings a distinct outer rhythm, which Rah can now use more confidently because your birth time is known.` +
        memoryContext,
      strength: 0.74,
      date: today(),
      relatedPlacement: `Rising in ${chart.corePlacements.rising.signLabel}`,
    });
  }

  signals.push({
    planet: "Mercury",
    signalType: `${transit.mercurySign} communication focus`,
    description:
      `Mercury is currently moving through ${transit.mercurySign}, so conversations and pattern recognition are likely to take on that tone today.` +
      memoryContext,
    strength: 0.64,
    date: today(),
  });

  return signals;
}
