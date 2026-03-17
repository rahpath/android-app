import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { storageAdapter } from "@/storage/storageAdapter";
import type { Insight } from "@/types/domain";

type NewInsight = Omit<Insight, "id">;

type InsightContextValue = {
  isLoading: boolean;
  insights: Insight[];
  addInsight: (insight: NewInsight) => Promise<Insight>;
  upsertInsight: (insight: NewInsight) => Promise<Insight>;
  getInsights: () => Insight[];
  getLatestInsight: (type?: string) => Insight | null;
  refreshInsights: () => Promise<void>;
};

const InsightContext = createContext<InsightContextValue | null>(null);

export function InsightProvider({ children }: { children: ReactNode }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const refreshInsights = async () => {
    const nextInsights = await storageAdapter.getInsights();
    setInsights(nextInsights);
  };

  const queueInsightWrite = async (
    updater: (currentInsights: Insight[]) => Insight[],
  ) => {
    let nextInsights: Insight[] = [];

    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const storedInsights = await storageAdapter.getInsights();
      nextInsights = updater(storedInsights);
      await storageAdapter.saveInsights(nextInsights);
      setInsights(nextInsights);
    });

    await writeQueueRef.current;
    return nextInsights;
  };

  const addInsight = async (insight: NewInsight) => {
    const nextInsight: Insight = {
      ...insight,
      id: `insight-${Date.now()}`,
      createdAt: insight.createdAt || new Date().toISOString(),
    };

    await queueInsightWrite((currentInsights) => [nextInsight, ...currentInsights]);
    return nextInsight;
  };

  const upsertInsight = async (insight: NewInsight) => {
    const nextInsight: Insight = {
      ...insight,
      id: `insight-${Date.now()}`,
      createdAt: insight.createdAt || new Date().toISOString(),
    };

    await queueInsightWrite((currentInsights) => [
      nextInsight,
      ...currentInsights.filter((existingInsight) => existingInsight.type !== nextInsight.type),
    ]);
    return nextInsight;
  };

  useEffect(() => {
    refreshInsights().finally(() => setIsLoading(false));
  }, []);

  return (
    <InsightContext.Provider
      value={{
        isLoading,
        insights,
        addInsight,
        upsertInsight,
        getInsights: () => insights,
        getLatestInsight: (type) =>
          type
            ? insights.find((insight) => insight.type === type) ?? null
            : insights[0] ?? null,
        refreshInsights,
      }}
    >
      {children}
    </InsightContext.Provider>
  );
}

export function useInsights() {
  const context = useContext(InsightContext);
  if (!context) {
    throw new Error("useInsights must be used within an InsightProvider");
  }
  return context;
}
