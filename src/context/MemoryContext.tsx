import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { storageAdapter } from "@/storage/storageAdapter";
import type { MemoryEvent } from "@/types/domain";

type NewMemoryEvent = Omit<MemoryEvent, "id" | "createdAt">;

type MemoryContextValue = {
  isLoading: boolean;
  memoryEvents: MemoryEvent[];
  addMemoryEvent: (event: NewMemoryEvent) => Promise<MemoryEvent>;
  addMemoryEvents: (events: NewMemoryEvent[]) => Promise<MemoryEvent[]>;
  replaceMemoryEventsByTag: (
    tag: string,
    events: NewMemoryEvent[],
  ) => Promise<MemoryEvent[]>;
  getMemoryEvents: () => MemoryEvent[];
  removeMemoryEvent: (id: string) => Promise<void>;
  refreshMemoryEvents: () => Promise<void>;
};

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [memoryEvents, setMemoryEvents] = useState<MemoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const refreshMemoryEvents = async () => {
    const events = await storageAdapter.getMemoryEvents();
    setMemoryEvents(events);
  };

  const queueMemoryWrite = async (
    updater: (currentEvents: MemoryEvent[]) => MemoryEvent[],
  ) => {
    let nextEvents: MemoryEvent[] = [];

    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const storedEvents = await storageAdapter.getMemoryEvents();
      nextEvents = updater(storedEvents);
      await storageAdapter.saveMemoryEvents(nextEvents);
      setMemoryEvents(nextEvents);
    });

    await writeQueueRef.current;
    return nextEvents;
  };

  const addMemoryEvent = async (event: NewMemoryEvent) => {
    const nextEvent: MemoryEvent = {
      ...event,
      id: `memory-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await queueMemoryWrite((currentEvents) => [nextEvent, ...currentEvents]);
    return nextEvent;
  };

  const addMemoryEvents = async (events: NewMemoryEvent[]) => {
    const createdEvents = events.map((event, index) => ({
      ...event,
      id: `memory-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
    }));
    await queueMemoryWrite((currentEvents) => [...createdEvents, ...currentEvents]);
    return createdEvents;
  };

  const replaceMemoryEventsByTag = async (tag: string, events: NewMemoryEvent[]) => {
    const replacementEvents = events.map((event, index) => ({
      ...event,
      id: `memory-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
    }));
    await queueMemoryWrite((currentEvents) => {
      const preservedEvents = currentEvents.filter((event) => !event.tags.includes(tag));
      return [...replacementEvents, ...preservedEvents];
    });
    return replacementEvents;
  };

  const removeMemoryEvent = async (id: string) => {
    await queueMemoryWrite((currentEvents) => currentEvents.filter((event) => event.id !== id));
  };

  useEffect(() => {
    refreshMemoryEvents().finally(() => setIsLoading(false));
  }, []);

  return (
    <MemoryContext.Provider
      value={{
        isLoading,
        memoryEvents,
        addMemoryEvent,
        addMemoryEvents,
        replaceMemoryEventsByTag,
        getMemoryEvents: () => memoryEvents,
        removeMemoryEvent,
        refreshMemoryEvents,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
}
