import { Body, EclipticLongitude, MoonPhase } from "astronomy-engine";

import { getSignFromDegree, normalizeDegree } from "@/astrology/signUtils";

export type LiveTransitSnapshot = {
  sunSign: string;
  moonSign: string;
  mercurySign: string;
  moonPhase: {
    label: string;
    value: number;
  };
};

function getMoonPhaseLabel(value: number) {
  if (value < 45) {
    return "new moon reset";
  }
  if (value < 90) {
    return "waxing crescent";
  }
  if (value < 135) {
    return "first quarter push";
  }
  if (value < 180) {
    return "waxing gibbous build";
  }
  if (value < 225) {
    return "full moon reveal";
  }
  if (value < 270) {
    return "waning gibbous integration";
  }
  if (value < 315) {
    return "last quarter release";
  }
  return "waning crescent pause";
}

export function buildLiveTransitSnapshot(date = new Date()): LiveTransitSnapshot {
  // The Sun's geocentric longitude is opposite the Earth's heliocentric longitude.
  const sunLongitude = normalizeDegree(EclipticLongitude(Body.Earth, date) + 180);
  const moonLongitude = normalizeDegree(EclipticLongitude(Body.Moon, date));
  const mercuryLongitude = normalizeDegree(EclipticLongitude(Body.Mercury, date));
  const moonPhaseValue = normalizeDegree(MoonPhase(date));

  return {
    sunSign: getSignFromDegree(sunLongitude).label,
    moonSign: getSignFromDegree(moonLongitude).label,
    mercurySign: getSignFromDegree(mercuryLongitude).label,
    moonPhase: {
      label: getMoonPhaseLabel(moonPhaseValue),
      value: moonPhaseValue,
    },
  };
}
