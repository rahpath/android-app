import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { storageAdapter } from "@/storage/storageAdapter";
import type { ContextIntent, CurrentContextState } from "@/types/domain";

type ContextContextValue = {
  isLoading: boolean;
  currentContext: CurrentContextState | null;
  refreshCurrentContext: () => Promise<void>;
  updateCurrentContext: (updates: Partial<CurrentContextState>) => Promise<void>;
  completeContextSetup: (payload: {
    activeIntent: ContextIntent;
    lifeRating: string;
    mainLifeArea: string;
    repeatingPattern: string;
    supportNeed: string;
    currentFocusSummary: string;
    followUpAnswers?: CurrentContextState["followUpAnswers"];
    followUpSummary?: string;
  }) => Promise<void>;
};

const ContextContext = createContext<ContextContextValue | null>(null);

export function ContextProvider({ children }: { children: ReactNode }) {
  const [currentContext, setCurrentContext] = useState<CurrentContextState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentContext = async () => {
    const nextContext = await storageAdapter.getCurrentContext();
    setCurrentContext(nextContext);
  };

  const updateCurrentContext = async (updates: Partial<CurrentContextState>) => {
    const existing = currentContext ?? (await storageAdapter.getCurrentContext());
    const nextContext: CurrentContextState = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setCurrentContext(nextContext);
    await storageAdapter.saveCurrentContext(nextContext);
  };

  const completeContextSetup: ContextContextValue["completeContextSetup"] = async (payload) => {
    await updateCurrentContext({
      ...payload,
      setupCompleted: true,
    });
  };

  useEffect(() => {
    refreshCurrentContext().finally(() => setIsLoading(false));
  }, []);

  return (
    <ContextContext.Provider
      value={{
        isLoading,
        currentContext,
        refreshCurrentContext,
        updateCurrentContext,
        completeContextSetup,
      }}
    >
      {children}
    </ContextContext.Provider>
  );
}

export function useCurrentContext() {
  const context = useContext(ContextContext);
  if (!context) {
    throw new Error("useCurrentContext must be used within a ContextProvider");
  }
  return context;
}
