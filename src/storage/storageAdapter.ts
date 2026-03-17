import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultUserProfile } from "@/mocks/userProfile";
import type {
  AdaptiveIntakeSession,
  CurrentContextState,
  DecisionRecord,
  Insight,
  MemoryEvent,
  NatalChart,
  ResolvedBirthLocation,
  UserProfile,
} from "@/types/domain";

const STORAGE_KEYS = {
  appInitialized: "app_initialized",
  appSchemaVersion: "rah:appSchemaVersion",
  userProfile: "rah:userProfile",
  memoryEvents: "rah:memoryEvents",
  insights: "rah:insights",
  decisions: "rah:decisions",
  currentContext: "rah:context",
  intakeSession: "journey_intake_progress",
  intakeCompleted: "rah:intakeCompleted",
  natalChart: "rah:natalChart",
  locationCache: "rah:locationCache",
} as const;

const CURRENT_APP_SCHEMA_VERSION = 1;

const defaultCurrentContextState: CurrentContextState = {
  activeIntent: "",
  lifeRating: "",
  mainLifeArea: "",
  repeatingPattern: "",
  supportNeed: "",
  currentFocusSummary: "",
  followUpAnswers: [],
  followUpSummary: "",
  setupCompleted: false,
  updatedAt: new Date().toISOString(),
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const normalizeStoredFollowUpAnswers = (
  answers: Partial<CurrentContextState>["followUpAnswers"],
) => {
  if (!Array.isArray(answers)) {
    return [];
  }

  const seen = new Set<string>();

  return answers.filter((item) => {
    if (!item?.questionId || seen.has(item.questionId)) {
      return false;
    }

    seen.add(item.questionId);
    return true;
  });
};

const normalizeStoredDecisions = (decisions: DecisionRecord[]) => {
  if (!Array.isArray(decisions)) {
    return [];
  }

  return decisions.map((decision) => {
    const wouldChooseAgain: DecisionRecord["wouldChooseAgain"] =
      decision.wouldChooseAgain === "yes"
      || decision.wouldChooseAgain === "no"
      || decision.wouldChooseAgain === "unsure"
        ? decision.wouldChooseAgain
        : "";

    return {
      ...decision,
      decisionPulse: decision.decisionPulse || "clarify",
      nextMove: decision.nextMove || "",
      latestInsight: decision.latestInsight || "",
      latestSections: decision.latestSections || null,
      chosenOption: decision.chosenOption || "",
      outcomeSummary: decision.outcomeSummary || "",
      emotionalOutcome: decision.emotionalOutcome || "",
      wouldChooseAgain,
      outcomeLoggedAt: decision.outcomeLoggedAt || "",
    };
  });
};

export const storageAdapter = {
  async initializeApp(): Promise<void> {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.appInitialized);
    if (initialized === "true") {
      await this.migrateAppData();
      return;
    }

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.appSchemaVersion, `${CURRENT_APP_SCHEMA_VERSION}`],
      [STORAGE_KEYS.userProfile, JSON.stringify(defaultUserProfile)],
      [STORAGE_KEYS.memoryEvents, JSON.stringify([])],
      [STORAGE_KEYS.insights, JSON.stringify([])],
      [STORAGE_KEYS.decisions, JSON.stringify([])],
      [STORAGE_KEYS.currentContext, JSON.stringify(defaultCurrentContextState)],
      [STORAGE_KEYS.intakeCompleted, "false"],
      [STORAGE_KEYS.locationCache, JSON.stringify({})],
      [STORAGE_KEYS.appInitialized, "true"],
    ]);
  },
  async migrateAppData(): Promise<void> {
    const rawVersion = await AsyncStorage.getItem(STORAGE_KEYS.appSchemaVersion);
    const version = Number(rawVersion || 0);
    const rawUser = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
    const rawContext = await AsyncStorage.getItem(STORAGE_KEYS.currentContext);

    const storedUser = safeParse<Partial<UserProfile>>(rawUser, defaultUserProfile);
    const storedContext = safeParse<Partial<CurrentContextState>>(
      rawContext,
      defaultCurrentContextState,
    );

    const migratedUser: UserProfile = {
      ...defaultUserProfile,
      ...storedUser,
      onboardingCompleted: Boolean(storedUser.onboardingCompleted),
      chartRevealed: Boolean(storedUser.chartRevealed),
      updatedAt: storedUser.updatedAt || new Date().toISOString(),
    };

    const migratedContext: CurrentContextState = {
      ...defaultCurrentContextState,
      ...storedContext,
      activeIntent: storedContext.activeIntent || "",
      followUpAnswers: normalizeStoredFollowUpAnswers(storedContext.followUpAnswers),
      followUpSummary: storedContext.followUpSummary || "",
      updatedAt: storedContext.updatedAt || new Date().toISOString(),
      setupCompleted: Boolean(storedContext.setupCompleted),
    };

    // When product flow changes, invalidate old onboarding assumptions safely.
    if (!migratedUser.birthDate || !migratedUser.birthLocation) {
      migratedUser.onboardingCompleted = false;
      migratedUser.chartRevealed = false;
      migratedContext.setupCompleted = false;
    }

    const writes: Array<[string, string]> = [
      [STORAGE_KEYS.appSchemaVersion, `${CURRENT_APP_SCHEMA_VERSION}`],
      [STORAGE_KEYS.userProfile, JSON.stringify(migratedUser)],
      [STORAGE_KEYS.currentContext, JSON.stringify(migratedContext)],
    ];

    if (version < CURRENT_APP_SCHEMA_VERSION) {
      writes.push([STORAGE_KEYS.intakeCompleted, "false"]);
    }

    await AsyncStorage.multiSet(writes);
  },
  async getUserProfile(): Promise<UserProfile> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
    return safeParse<UserProfile>(raw, defaultUserProfile);
  },
  async saveUserProfile(user: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
  },
  async getMemoryEvents(): Promise<MemoryEvent[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.memoryEvents);
    return safeParse<MemoryEvent[]>(raw, []);
  },
  async saveMemoryEvents(events: MemoryEvent[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.memoryEvents, JSON.stringify(events));
  },
  async getInsights(): Promise<Insight[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.insights);
    return safeParse<Insight[]>(raw, []);
  },
  async saveInsights(insights: Insight[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.insights, JSON.stringify(insights));
  },
  async getDecisions(): Promise<DecisionRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.decisions);
    return normalizeStoredDecisions(safeParse<DecisionRecord[]>(raw, []));
  },
  async saveDecisions(decisions: DecisionRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.decisions, JSON.stringify(decisions));
  },
  async getCurrentContext(): Promise<CurrentContextState> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.currentContext);
    return safeParse<CurrentContextState>(raw, defaultCurrentContextState);
  },
  async saveCurrentContext(context: CurrentContextState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.currentContext, JSON.stringify(context));
  },
  async getNatalChart(): Promise<NatalChart | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.natalChart);
    return safeParse<NatalChart | null>(raw, null);
  },
  async saveNatalChart(chart: NatalChart): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.natalChart, JSON.stringify(chart));
  },
  async clearNatalChart(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.natalChart);
  },
  async getCachedBirthLocation(query: string): Promise<ResolvedBirthLocation | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.locationCache);
    const cache = safeParse<Record<string, ResolvedBirthLocation>>(raw, {});
    return cache[query.trim().toLowerCase()] ?? null;
  },
  async saveCachedBirthLocation(
    query: string,
    location: ResolvedBirthLocation,
  ): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.locationCache);
    const cache = safeParse<Record<string, ResolvedBirthLocation>>(raw, {});
    cache[query.trim().toLowerCase()] = location;
    await AsyncStorage.setItem(STORAGE_KEYS.locationCache, JSON.stringify(cache));
  },
  async getAdaptiveIntakeSession(): Promise<AdaptiveIntakeSession | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.intakeSession);
    return safeParse<AdaptiveIntakeSession | null>(raw, null);
  },
  async saveAdaptiveIntakeSession(session: AdaptiveIntakeSession): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.intakeSession,
      JSON.stringify(session),
    );
  },
  async clearAdaptiveIntakeSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.intakeSession);
  },
  async getIntakeCompleted(): Promise<boolean> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.intakeCompleted)) === "true";
  },
  async saveIntakeCompleted(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.intakeCompleted, value ? "true" : "false");
  },
  async resetAppData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.userProfile,
      STORAGE_KEYS.memoryEvents,
      STORAGE_KEYS.insights,
      STORAGE_KEYS.decisions,
      STORAGE_KEYS.currentContext,
      STORAGE_KEYS.intakeSession,
      STORAGE_KEYS.intakeCompleted,
      STORAGE_KEYS.natalChart,
      STORAGE_KEYS.locationCache,
      STORAGE_KEYS.appSchemaVersion,
      STORAGE_KEYS.appInitialized,
    ]);
    await this.initializeApp();
  },
};

export type StorageAdapter = typeof storageAdapter;
