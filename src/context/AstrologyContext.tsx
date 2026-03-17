import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildChartBackedSignals } from "@/astrology/chartInterpreter";
import { buildNatalChart } from "@/astrology/natalChartEngine";
import { useMemory } from "@/context/MemoryContext";
import { useUser } from "@/context/UserContext";
import { mockAstrologySignals } from "@/mocks/astrologySignals";
import { storageAdapter } from "@/storage/storageAdapter";
import type { AstrologySignal, NatalChart } from "@/types/domain";

type AstrologyContextValue = {
  isLoading: boolean;
  chartReady: boolean;
  hasBirthData: boolean;
  natalChart: NatalChart | null;
  signals: AstrologySignal[];
  error: string | null;
  getSignals: () => AstrologySignal[];
  getPrimarySignal: () => AstrologySignal | null;
};

const AstrologyContext = createContext<AstrologyContextValue | null>(null);

export function AstrologyProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { memoryEvents } = useMemory();
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasBirthData = Boolean(user?.birthDate && user.birthLocation);

  useEffect(() => {
    let isMounted = true;

    async function loadChart() {
      if (!user?.birthDate || !user.birthLocation) {
        setNatalChart(null);
        setError(null);
        setIsLoading(false);
        await storageAdapter.clearNatalChart();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const cachedChart = await storageAdapter.getNatalChart();
        const chartSignature = [
          user.birthDate,
          user.birthTime || "time-unknown",
          user.birthLocation.trim().toLowerCase(),
        ].join("|");

        if (cachedChart && cachedChart.chartSignature.startsWith(chartSignature)) {
          if (isMounted) {
            setNatalChart(cachedChart);
            setIsLoading(false);
          }
          return;
        }

        const nextChart = await buildNatalChart(user);
        await storageAdapter.saveNatalChart(nextChart);

        if (isMounted) {
          setNatalChart(nextChart);
        }
      } catch (caughtError) {
        if (isMounted) {
          setNatalChart(null);
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Rah could not read the birth chart yet.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [user?.birthDate, user?.birthLocation, user?.birthTime]);

  const signals = useMemo(() => {
    if (!natalChart) {
      return mockAstrologySignals;
    }

    return buildChartBackedSignals(natalChart, memoryEvents);
  }, [memoryEvents, natalChart]);

  const value = useMemo<AstrologyContextValue>(
    () => ({
      isLoading,
      chartReady: Boolean(natalChart),
      hasBirthData,
      natalChart,
      signals,
      error,
      getSignals: () => signals,
      getPrimarySignal: () => signals[0] ?? null,
    }),
    [error, hasBirthData, isLoading, natalChart, signals],
  );

  return (
    <AstrologyContext.Provider value={value}>
      {children}
    </AstrologyContext.Provider>
  );
}

export function useAstrology() {
  const context = useContext(AstrologyContext);
  if (!context) {
    throw new Error("useAstrology must be used within an AstrologyProvider");
  }
  return context;
}
