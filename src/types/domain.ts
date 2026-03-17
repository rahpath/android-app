export type UserProfile = {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  onboardingCompleted: boolean;
  chartRevealed: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ChartAccuracy = "full_time" | "date_only";

export type ResolvedBirthLocation = {
  query: string;
  label: string;
  latitude: number;
  longitude: number;
  country?: string;
  resolvedAt: string;
};

export type ChartCoordinate = {
  degree: number;
  degreeLabel: string;
  degreeWithinSign: string;
};

export type PlanetPlacement = {
  key: string;
  label: string;
  signKey: string;
  signLabel: string;
  house: number | null;
  degree: number;
  degreeLabel: string;
  degreeWithinSign: string;
  retrograde: boolean;
};

export type HousePlacement = {
  id: number;
  label: string;
  signKey: string;
  signLabel: string;
  degree: number;
  degreeLabel: string;
};

export type ChartAspect = {
  fromKey: string;
  fromLabel: string;
  toKey: string;
  toLabel: string;
  aspectKey: string;
  aspectLabel: string;
  orb: number;
  level: string;
};

export type NatalChart = {
  source: "circular-natal-horoscope-js";
  zodiac: "tropical";
  houseSystem: "placidus";
  chartSignature: string;
  generatedAt: string;
  accuracy: ChartAccuracy;
  location: ResolvedBirthLocation;
  placements: PlanetPlacement[];
  houses: HousePlacement[];
  aspects: ChartAspect[];
  corePlacements: {
    sun: PlanetPlacement | null;
    moon: PlanetPlacement | null;
    rising: ChartCoordinate & { signKey: string; signLabel: string } | null;
    midheaven: ChartCoordinate & { signKey: string; signLabel: string } | null;
  };
  summary: string;
};

export type MemoryEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  tags: string[];
  createdAt: string;
};

export type Insight = {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  source: string;
};

export type AstrologySignal = {
  planet: string;
  signalType: string;
  description: string;
  strength: number;
  date: string;
  relatedPlacement?: string;
};

export type BirthDataAnswer = {
  birthDate: string;
  birthTime: string;
  birthLocation: string;
};

export type IntakeQuestionType =
  | "rating"
  | "multiple_choice"
  | "chips"
  | "short_text"
  | "birth_data";

export type IntakeQuestionOption = {
  label: string;
  value: string;
};

export type IntakeStage =
  | "broad_signal"
  | "life_area"
  | "situation"
  | "deeper_context"
  | "birth_data"
  | "completion";

export type IntakeQuestion = {
  id: string;
  type: IntakeQuestionType;
  question: string;
  category: string;
  stage: IntakeStage;
  options?: IntakeQuestionOption[];
  placeholder?: string;
};

export type IntakeAnswerValue = string | string[] | BirthDataAnswer;

export type IntakeAnswer = {
  id: string;
  questionId: string;
  answer: IntakeAnswerValue;
  timestamp: string;
};

export type AdaptiveIntakeSession = {
  currentQuestionId: string | null;
  currentQuestionOverride?: string | null;
  answers: IntakeAnswer[];
  questionHistory: string[];
  stage: IntakeStage;
  isComplete: boolean;
  startedAt: string;
  updatedAt: string;
};

export type ContextIntent =
  | "understand_myself"
  | "decision_support"
  | "relationship_clarity"
  | "career_direction"
  | "emotional_grounding";

export type CurrentContextState = {
  activeIntent: ContextIntent | "";
  lifeRating: string;
  mainLifeArea: string;
  repeatingPattern: string;
  supportNeed: string;
  currentFocusSummary: string;
  followUpAnswers: Array<{
    questionId: string;
    question: string;
    answer: string;
  }>;
  followUpSummary: string;
  setupCompleted: boolean;
  updatedAt: string;
};

export type DecisionUrgency = "right_now" | "soon" | "open_timeline";

export type DecisionStatus = "draft" | "analyzed" | "outcome_logged";

export type DecisionPulse = "move" | "wait" | "clarify";

export type DecisionRecord = {
  id: string;
  title: string;
  situation: string;
  options: string[];
  desiredOutcome: string;
  biggestFear: string;
  urgency: DecisionUrgency;
  status: DecisionStatus;
  decisionPulse: DecisionPulse;
  nextMove: string;
  latestInsight: string;
  latestSections: DecisionInsightSections | null;
  chosenOption: string;
  outcomeSummary: string;
  emotionalOutcome: string;
  wouldChooseAgain: "yes" | "no" | "unsure" | "";
  outcomeLoggedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DecisionInsightSections = {
  decisionPulse?: DecisionPulse;
  coreTension: string;
  supportsAction: string;
  suggestsWaiting: string;
  blindSpot: string;
  nextMove: string;
};

export type SupremeContext = {
  userProfile: UserProfile | null;
  natalChart: NatalChart | null;
  astrologySignals: AstrologySignal[];
  currentContext: CurrentContextState | null;
  memoryEvents: MemoryEvent[];
  recentInsights: Insight[];
  recentDecisions: DecisionRecord[];
  supremeSummary: string;
};
