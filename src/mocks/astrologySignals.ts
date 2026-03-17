import type { AstrologySignal } from "@/types/domain";

const today = new Date().toISOString().slice(0, 10);

export const mockAstrologySignals: AstrologySignal[] = [
  {
    planet: "Moon",
    signalType: "emotional clarity",
    description: "Reflective emotional state",
    strength: 0.7,
    date: today,
  },
  {
    planet: "Mercury",
    signalType: "pattern awareness",
    description: "Thoughts are linking old experiences to present choices.",
    strength: 0.62,
    date: today,
  },
  {
    planet: "Venus",
    signalType: "relationship sensitivity",
    description: "Connections may feel more emotionally revealing today.",
    strength: 0.58,
    date: today,
  },
];
