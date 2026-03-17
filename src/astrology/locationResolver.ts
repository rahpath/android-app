import { storageAdapter } from "@/storage/storageAdapter";
import type { ResolvedBirthLocation } from "@/types/domain";

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
  };
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export async function resolveBirthLocation(query: string): Promise<ResolvedBirthLocation> {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    throw new Error("Birth location is required.");
  }

  const cached = await storageAdapter.getCachedBirthLocation(normalizedQuery);
  if (cached) {
    return cached;
  }

  const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "RahMobileDemo/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Rah could not map that birth place yet.");
  }

  const results = (await response.json()) as NominatimResult[];
  const match = results[0];
  if (!match) {
    throw new Error("Rah could not find that birth place.");
  }

  const resolvedLocation: ResolvedBirthLocation = {
    query: normalizedQuery,
    label: match.display_name,
    latitude: Number(match.lat),
    longitude: Number(match.lon),
    country: match.address?.country,
    resolvedAt: new Date().toISOString(),
  };

  await storageAdapter.saveCachedBirthLocation(normalizedQuery, resolvedLocation);
  return resolvedLocation;
}
