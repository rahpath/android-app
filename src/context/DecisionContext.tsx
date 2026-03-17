import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { storageAdapter } from "@/storage/storageAdapter";
import type { DecisionRecord } from "@/types/domain";

type NewDecisionRecord = Omit<DecisionRecord, "id" | "createdAt" | "updatedAt">;

type DecisionContextValue = {
  isLoading: boolean;
  decisions: DecisionRecord[];
  addDecision: (decision: NewDecisionRecord) => Promise<DecisionRecord>;
  updateDecision: (id: string, updates: Partial<DecisionRecord>) => Promise<DecisionRecord | null>;
  refreshDecisions: () => Promise<void>;
  getLatestDecision: () => DecisionRecord | null;
  getDecisionNeedingOutcome: () => DecisionRecord | null;
};

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const refreshDecisions = async () => {
    const nextDecisions = await storageAdapter.getDecisions();
    setDecisions(nextDecisions);
  };

  const queueDecisionWrite = async (
    updater: (currentDecisions: DecisionRecord[]) => DecisionRecord[],
  ) => {
    let nextDecisions: DecisionRecord[] = [];

    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const storedDecisions = await storageAdapter.getDecisions();
      nextDecisions = updater(storedDecisions);
      await storageAdapter.saveDecisions(nextDecisions);
      setDecisions(nextDecisions);
    });

    await writeQueueRef.current;
    return nextDecisions;
  };

  const addDecision = async (decision: NewDecisionRecord) => {
    const createdAt = new Date().toISOString();
    const nextDecision: DecisionRecord = {
      ...decision,
      id: `decision-${Date.now()}`,
      createdAt,
      updatedAt: createdAt,
    };

    await queueDecisionWrite((currentDecisions) => [nextDecision, ...currentDecisions]);
    return nextDecision;
  };

  const updateDecision = async (id: string, updates: Partial<DecisionRecord>) => {
    let updatedDecision: DecisionRecord | null = null;

    await queueDecisionWrite((currentDecisions) =>
      currentDecisions.map((decision) => {
        if (decision.id !== id) {
          return decision;
        }

        updatedDecision = {
          ...decision,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        return updatedDecision;
      }),
    );

    return updatedDecision;
  };

  useEffect(() => {
    refreshDecisions().finally(() => setIsLoading(false));
  }, []);

  return (
    <DecisionContext.Provider
      value={{
        isLoading,
        decisions,
        addDecision,
        updateDecision,
        refreshDecisions,
        getLatestDecision: () => decisions[0] ?? null,
        getDecisionNeedingOutcome: () =>
          decisions.find((decision) => decision.status === "analyzed" && !decision.outcomeLoggedAt) ?? null,
      }}
    >
      {children}
    </DecisionContext.Provider>
  );
}

export function useDecision() {
  const context = useContext(DecisionContext);
  if (!context) {
    throw new Error("useDecision must be used within a DecisionProvider");
  }
  return context;
}
