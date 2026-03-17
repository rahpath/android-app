import { Horoscope, Origin } from "circular-natal-horoscope-js";

import { resolveBirthLocation } from "@/astrology/locationResolver";
import {
  formatDegreeLabel,
  formatDegreeWithinSign,
  getSignFromDegree,
  normalizeDegree,
} from "@/astrology/signUtils";
import type {
  ChartAccuracy,
  ChartAspect,
  HousePlacement,
  NatalChart,
  PlanetPlacement,
  ResolvedBirthLocation,
  UserProfile,
} from "@/types/domain";

type ChartBody = {
  key: string;
  label: string;
  Sign?: {
    key: string;
    label: string;
  };
  House?: {
    id: number;
  };
  ChartPosition?: {
    Ecliptic?: {
      DecimalDegrees: number;
    };
  };
  isRetrograde?: boolean;
};

type ChartHouse = {
  id: number;
  label: string;
  Sign: {
    key: string;
    label: string;
  };
  ChartPosition: {
    StartPosition: {
      Ecliptic: {
        DecimalDegrees: number;
      };
    };
  };
};

type ChartAngle = {
  Sign: {
    key: string;
    label: string;
  };
  ChartPosition: {
    Ecliptic: {
      DecimalDegrees: number;
    };
  };
};

type ChartAspectSource = {
  point1Key: string;
  point1Label: string;
  point2Key: string;
  point2Label: string;
  aspectKey: string;
  label: string;
  orb: number;
  aspectLevel: string;
};

const DEFAULT_HOUR = 12;
const DEFAULT_MINUTE = 0;

function parseBirthTime(value: string): {
  hour: number;
  minute: number;
  accuracy: ChartAccuracy;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
      accuracy: "date_only",
    };
  }

  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const modifier = amPmMatch[3].toLowerCase();
    if (modifier === "pm" && hour < 12) {
      hour += 12;
    }
    if (modifier === "am" && hour === 12) {
      hour = 0;
    }
    return { hour, minute, accuracy: "full_time" };
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return {
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
      accuracy: "date_only",
    };
  }

  return {
    hour: Math.min(23, Math.max(0, Number(match[1]))),
    minute: Math.min(59, Math.max(0, Number(match[2]))),
    accuracy: "full_time",
  };
}

function parseBirthDate(value: string) {
  const [year, month, date] = value.split("-").map((segment) => Number(segment));
  if (!year || !month || !date) {
    throw new Error("Birth date must use YYYY-MM-DD.");
  }

  return {
    year,
    month: month - 1,
    date,
  };
}

function placementFromBody(body: ChartBody, accuracy: ChartAccuracy): PlanetPlacement | null {
  const degree = body.ChartPosition?.Ecliptic?.DecimalDegrees;
  const signKey = body.Sign?.key;
  const signLabel = body.Sign?.label;
  if (degree == null || !signKey || !signLabel) {
    return null;
  }

  return {
    key: body.key,
    label: body.label,
    signKey,
    signLabel,
    house: accuracy === "full_time" ? (body.House?.id ?? null) : null,
    degree: normalizeDegree(degree),
    degreeLabel: formatDegreeLabel(degree),
    degreeWithinSign: formatDegreeWithinSign(degree),
    retrograde: Boolean(body.isRetrograde),
  };
}

function houseFromSource(house: ChartHouse): HousePlacement {
  const degree = house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
  return {
    id: house.id,
    label: house.label,
    signKey: house.Sign.key,
    signLabel: house.Sign.label,
    degree: normalizeDegree(degree),
    degreeLabel: formatDegreeLabel(degree),
  };
}

function aspectFromSource(aspect: ChartAspectSource): ChartAspect {
  return {
    fromKey: aspect.point1Key,
    fromLabel: aspect.point1Label,
    toKey: aspect.point2Key,
    toLabel: aspect.point2Label,
    aspectKey: aspect.aspectKey,
    aspectLabel: aspect.label,
    orb: Number(aspect.orb.toFixed(2)),
    level: aspect.aspectLevel,
  };
}

function buildSummary(
  placements: PlanetPlacement[],
  accuracy: ChartAccuracy,
  resolvedLocation: ResolvedBirthLocation,
) {
  const sun = placements.find((placement) => placement.key === "sun");
  const moon = placements.find((placement) => placement.key === "moon");

  const parts = [
    sun ? `Sun in ${sun.signLabel}` : null,
    moon ? `Moon in ${moon.signLabel}` : null,
    accuracy === "full_time" ? "Birth time is available for angular chart reading" : "Birth time still missing, so Rah is holding house and rising claims lightly",
    `mapped through ${resolvedLocation.label.split(",")[0]}`,
  ].filter(Boolean);

  return parts.join(" · ");
}

export async function buildNatalChart(user: UserProfile): Promise<NatalChart> {
  if (!user.birthDate || !user.birthLocation) {
    throw new Error("Birth date and location are required for a natal chart.");
  }

  const resolvedLocation = await resolveBirthLocation(user.birthLocation);
  const parsedDate = parseBirthDate(user.birthDate);
  const parsedTime = parseBirthTime(user.birthTime);

  const origin = new Origin({
    year: parsedDate.year,
    month: parsedDate.month,
    date: parsedDate.date,
    hour: parsedTime.hour,
    minute: parsedTime.minute,
    latitude: resolvedLocation.latitude,
    longitude: resolvedLocation.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    language: "en",
  }) as {
    Ascendant: ChartAngle;
    Midheaven: ChartAngle;
    CelestialBodies: {
      all: ChartBody[];
    };
    Houses: ChartHouse[];
    Aspects: {
      all: ChartAspectSource[];
    };
  };

  const placements = horoscope.CelestialBodies.all
    .map((body) => placementFromBody(body, parsedTime.accuracy))
    .filter((placement): placement is PlanetPlacement => Boolean(placement));

  const ascendantDegree = horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
  const midheavenDegree = horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees;
  const ascendantSign = getSignFromDegree(ascendantDegree);
  const midheavenSign = getSignFromDegree(midheavenDegree);

  const chart: NatalChart = {
    source: "circular-natal-horoscope-js",
    zodiac: "tropical",
    houseSystem: "placidus",
    chartSignature: [
      user.birthDate,
      user.birthTime || "time-unknown",
      user.birthLocation.trim().toLowerCase(),
      resolvedLocation.latitude.toFixed(4),
      resolvedLocation.longitude.toFixed(4),
    ].join("|"),
    generatedAt: new Date().toISOString(),
    accuracy: parsedTime.accuracy,
    location: resolvedLocation,
    placements,
    houses:
      parsedTime.accuracy === "full_time"
        ? horoscope.Houses.map((house) => houseFromSource(house))
        : [],
    aspects: horoscope.Aspects.all
      .filter((aspect) => aspect.point1Key !== "southnode" && aspect.point2Key !== "southnode")
      .slice(0, 12)
      .map((aspect) => aspectFromSource(aspect)),
    corePlacements: {
      sun: placements.find((placement) => placement.key === "sun") ?? null,
      moon: placements.find((placement) => placement.key === "moon") ?? null,
      rising:
        parsedTime.accuracy === "full_time"
          ? {
              signKey: ascendantSign.key,
              signLabel: ascendantSign.label,
              degree: normalizeDegree(ascendantDegree),
              degreeLabel: formatDegreeLabel(ascendantDegree),
              degreeWithinSign: formatDegreeWithinSign(ascendantDegree),
            }
          : null,
      midheaven:
        parsedTime.accuracy === "full_time"
          ? {
              signKey: midheavenSign.key,
              signLabel: midheavenSign.label,
              degree: normalizeDegree(midheavenDegree),
              degreeLabel: formatDegreeLabel(midheavenDegree),
              degreeWithinSign: formatDegreeWithinSign(midheavenDegree),
            }
          : null,
    },
    summary: buildSummary(placements, parsedTime.accuracy, resolvedLocation),
  };

  return chart;
}
