import { getIntakeQuestionById, intakeQuestionPool } from "@/config/intakeQuestionPool";
import { useAstrology, useMemory, useUser } from "@/context";
import { intakePrePrompt } from "@/intelligence/intakePrePrompt";
import { mapIntakeAnswersToMemoryEvents } from "@/intelligence/memoryMapper";
import { sendPrompt } from "@/services/aiClient";
import { storageAdapter } from "@/storage/storageAdapter";
import type {
  AdaptiveIntakeSession,
  BirthDataAnswer,
  IntakeAnswer,
  IntakeQuestion,
  IntakeStage,
} from "@/types/domain";

type IntakeSelectionResponse = {
  nextQuestionId?: string;
  overrideQuestion?: string;
};

const TOTAL_EXPECTED_STEPS = 5;

const createEmptySession = (): AdaptiveIntakeSession => ({
  currentQuestionId: "life_rating",
  currentQuestionOverride: null,
  answers: [],
  questionHistory: [],
  stage: "broad_signal",
  isComplete: false,
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const normalizeSession = (session: Partial<AdaptiveIntakeSession> | null | undefined) => {
  if (!session) {
    return createEmptySession();
  }

  const hasValidCurrentQuestion = session.currentQuestionId
    ? Boolean(getIntakeQuestionById(session.currentQuestionId))
    : false;

  return {
    currentQuestionId: hasValidCurrentQuestion ? session.currentQuestionId ?? null : null,
    currentQuestionOverride: session.currentQuestionOverride ?? null,
    answers: Array.isArray(session.answers) ? session.answers : [],
    questionHistory: Array.isArray(session.questionHistory) ? session.questionHistory : [],
    stage: session.stage ?? "broad_signal",
    isComplete: Boolean(session.isComplete),
    startedAt: session.startedAt ?? new Date().toISOString(),
    updatedAt: session.updatedAt ?? new Date().toISOString(),
  } satisfies AdaptiveIntakeSession;
};

const getAnswerByQuestionId = (session: AdaptiveIntakeSession, questionId: string) =>
  session.answers.find((answer) => answer.questionId === questionId);

const getAnswerText = (answer: IntakeAnswer["answer"]) => {
  if (typeof answer === "string") {
    return answer;
  }
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  return [answer.birthDate, answer.birthTime, answer.birthLocation].filter(Boolean).join(", ");
};

const getSelectedArea = (session: AdaptiveIntakeSession) => {
  const areaAnswer = getAnswerByQuestionId(session, "main_worry_area");
  return typeof areaAnswer?.answer === "string" ? areaAnswer.answer : null;
};

const getAreaSituationQuestionId = (area: string | null) => {
  switch (area) {
    case "career":
      return "career_situation";
    case "relationships":
      return "relationships_situation";
    case "purpose":
      return "purpose_situation";
    case "money":
      return "money_situation";
    case "family":
      return "family_situation";
    case "health":
      return "health_situation";
    default:
      return "other_situation";
  }
};

const getAreaPatternQuestionId = (area: string | null) => {
  switch (area) {
    case "career":
      return "career_pattern";
    case "relationships":
      return "relationships_pattern";
    case "purpose":
      return "purpose_pattern";
    case "money":
      return "money_pattern";
    case "family":
      return "family_pattern";
    case "health":
      return "health_pattern";
    default:
      return "other_pattern";
  }
};

const getNextStage = (questionId: string): IntakeStage => {
  return getIntakeQuestionById(questionId)?.stage ?? "deeper_context";
};

const buildCandidateList = (session: AdaptiveIntakeSession) => {
  const candidates: IntakeQuestion[] = [];
  const lifeRating = getAnswerByQuestionId(session, "life_rating");
  if (!lifeRating) {
    return [getIntakeQuestionById("life_rating")].filter(Boolean) as IntakeQuestion[];
  }

  const area = getSelectedArea(session);
  if (!area) {
    return [getIntakeQuestionById("main_worry_area")].filter(Boolean) as IntakeQuestion[];
  }

  const situationQuestionId = getAreaSituationQuestionId(area);
  if (!getAnswerByQuestionId(session, situationQuestionId)) {
    return [getIntakeQuestionById(situationQuestionId)].filter(Boolean) as IntakeQuestion[];
  }

  const patternQuestionId = getAreaPatternQuestionId(area);
  if (!getAnswerByQuestionId(session, patternQuestionId)) {
    const patternQuestion = getIntakeQuestionById(patternQuestionId);
    if (patternQuestion) {
      candidates.push(patternQuestion);
    }
  }

  if (!getAnswerByQuestionId(session, "support_style")) {
    const supportQuestion = getIntakeQuestionById("support_style");
    if (supportQuestion) {
      candidates.push(supportQuestion);
    }
  }

  if (!getAnswerByQuestionId(session, "deeper_reflection")) {
    const reflectionQuestion = getIntakeQuestionById("deeper_reflection");
    if (reflectionQuestion) {
      candidates.push(reflectionQuestion);
    }
  }

  return candidates;
};

const tryParseSelection = (value: unknown): IntakeSelectionResponse | null => {
  try {
    if (typeof value === "string") {
      return JSON.parse(
        value.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim(),
      ) as IntakeSelectionResponse;
    }

    const response = value as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = response?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
      ?? "";

    if (!text) {
      return null;
    }

    return JSON.parse(
      text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim(),
    ) as IntakeSelectionResponse;
  } catch {
    return null;
  }
};

const chooseDeterministicCandidate = (candidates: IntakeQuestion[]) => candidates[0] ?? null;

const buildSelectionPrompt = (
  session: AdaptiveIntakeSession,
  candidates: IntakeQuestion[],
  context: {
    userName: string;
    memorySummary: string;
    signalSummary: string;
  },
) => {
  const answeredSummary = session.answers.length > 0
    ? session.answers
        .map((answer) => `${answer.questionId}: ${getAnswerText(answer.answer)}`)
        .join("\n")
    : "No answers yet.";

  const candidateSummary = candidates
    .map((candidate) => {
      const options = candidate.options?.map((option) => option.label).join(", ");
      return `- ${candidate.id}: ${candidate.question} [${candidate.type}]${options ? ` Options: ${options}` : ""}`;
    })
    .join("\n");

  return `
${intakePrePrompt.trim()}

Current answers:
${answeredSummary}

Existing context:
User: ${context.userName}
Memories: ${context.memorySummary}
Astrology: ${context.signalSummary}

Current stage:
${session.stage}

Candidate questions:
${candidateSummary}
`.trim();
};

const resolveNextQuestion = async (
  session: AdaptiveIntakeSession,
  candidates: IntakeQuestion[],
  context: {
    userName: string;
    memorySummary: string;
    signalSummary: string;
  },
) => {
  if (candidates.length === 0) {
    return {
      nextQuestion: null,
      overrideQuestion: null,
    };
  }

  if (candidates.length === 1) {
    return {
      nextQuestion: candidates[0],
      overrideQuestion: null,
    };
  }

  try {
    const prompt = buildSelectionPrompt(session, candidates, context);
    const rawResponse = await sendPrompt(prompt);
    const parsed = tryParseSelection(rawResponse);
    const nextQuestion = candidates.find(
      (candidate) => candidate.id === parsed?.nextQuestionId,
    );

    return {
      nextQuestion: nextQuestion ?? chooseDeterministicCandidate(candidates),
      overrideQuestion: parsed?.overrideQuestion?.trim() || null,
    };
  } catch {
    return {
      nextQuestion: chooseDeterministicCandidate(candidates),
      overrideQuestion: null,
    };
  }
};

export function useAdaptiveIntakeEngine() {
  const { user, updateUser } = useUser();
  const { memoryEvents, replaceMemoryEventsByTag } = useMemory();
  const { signals } = useAstrology();

  const loadSession = async () => {
    const stored = await storageAdapter.getAdaptiveIntakeSession();
    return normalizeSession(stored);
  };

  const getCurrentQuestion = async () => {
    const session = await loadSession();
    let currentQuestion = session.currentQuestionId
      ? getIntakeQuestionById(session.currentQuestionId)
      : null;
    let questionText = session.currentQuestionOverride || currentQuestion?.question || "";

    if (!currentQuestion) {
      const candidates = buildCandidateList(session);
      const fallbackQuestion = chooseDeterministicCandidate(candidates);
      if (fallbackQuestion) {
        currentQuestion = fallbackQuestion;
        questionText = fallbackQuestion.question;

        const hydratedSession: AdaptiveIntakeSession = {
          ...session,
          currentQuestionId: fallbackQuestion.id,
          currentQuestionOverride: null,
          stage: getNextStage(fallbackQuestion.id),
          updatedAt: new Date().toISOString(),
        };

        await storageAdapter.saveAdaptiveIntakeSession(hydratedSession);

        return {
          session: hydratedSession,
          question: fallbackQuestion,
          questionText,
          totalExpectedSteps: TOTAL_EXPECTED_STEPS,
        };
      }
    }

    return {
      session,
      question: currentQuestion,
      questionText,
      totalExpectedSteps: TOTAL_EXPECTED_STEPS,
    };
  };

  const submitAnswer = async (questionId: string, answer: IntakeAnswer["answer"]) => {
    const session = await loadSession();

    const nextAnswer: IntakeAnswer = {
      id: `intake-answer-${Date.now()}`,
      questionId,
      answer,
      timestamp: new Date().toISOString(),
    };

    const filteredAnswers = session.answers.filter(
      (existingAnswer) => existingAnswer.questionId !== questionId,
    );

    const nextSession: AdaptiveIntakeSession = {
      ...session,
      answers: [...filteredAnswers, nextAnswer],
      questionHistory: [...session.questionHistory, questionId],
      updatedAt: new Date().toISOString(),
      currentQuestionOverride: null,
    };

    if (questionId === "birth_data" && typeof answer !== "string" && !Array.isArray(answer)) {
      const birthAnswer = answer as BirthDataAnswer;
      await updateUser({
        birthDate: birthAnswer.birthDate,
        birthTime: birthAnswer.birthTime,
        birthLocation: birthAnswer.birthLocation,
      });
    }

    const liveMemoryPayload = mapIntakeAnswersToMemoryEvents(nextSession.answers);
    await replaceMemoryEventsByTag("intake_context", liveMemoryPayload);

    const candidates = buildCandidateList(nextSession);
    if (candidates.length === 0) {
      await storageAdapter.saveIntakeCompleted(true);
      await storageAdapter.clearAdaptiveIntakeSession();

      const completedSession: AdaptiveIntakeSession = {
        ...nextSession,
        currentQuestionId: null,
        stage: "completion",
        isComplete: true,
      };

      return {
        session: completedSession,
        question: null,
        questionText: "Thanks. I'm starting to understand your journey.",
        totalExpectedSteps: TOTAL_EXPECTED_STEPS,
        isComplete: true,
      };
    }

    const context = {
      userName: user?.name ?? "Aryan",
      memorySummary:
        memoryEvents.length > 0
          ? memoryEvents
              .slice(0, 3)
              .map((event) => `${event.title}: ${event.description}`)
              .join(" | ")
          : "No strong stored memories yet.",
      signalSummary:
        signals.length > 0
          ? signals
              .slice(0, 2)
              .map((signal) => `${signal.planet} ${signal.signalType}`)
              .join(" | ")
          : "No astrology signals available.",
    };
    const { nextQuestion, overrideQuestion } = await resolveNextQuestion(
      nextSession,
      candidates,
      context,
    );
    const resolvedSession: AdaptiveIntakeSession = {
      ...nextSession,
      currentQuestionId: nextQuestion?.id ?? null,
      currentQuestionOverride: overrideQuestion,
      stage: nextQuestion ? getNextStage(nextQuestion.id) : "completion",
      isComplete: !nextQuestion,
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.saveAdaptiveIntakeSession(resolvedSession);

    return {
      session: resolvedSession,
      question: nextQuestion,
      questionText: overrideQuestion || nextQuestion?.question || "",
      totalExpectedSteps: TOTAL_EXPECTED_STEPS,
      isComplete: false,
    };
  };

  return {
    intakeQuestionPool,
    loadSession,
    getCurrentQuestion,
    submitAnswer,
  };
}
