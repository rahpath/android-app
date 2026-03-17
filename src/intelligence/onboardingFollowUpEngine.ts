import { followUpQuestionPool, getFollowUpQuestionById, type FollowUpQuestion } from "@/config/followUpQuestionPool";
import { useAstrology, useCurrentContext, useMemory, useUser } from "@/context";
import { intakePrePrompt } from "@/intelligence/intakePrePrompt";
import { sendPrompt } from "@/services/aiClient";

type SelectionResponse = {
  nextQuestionId?: string;
  overrideQuestion?: string;
};

export const FOLLOW_UP_TARGET_COUNT = 4;

function formatCurrentSeed(context: ReturnType<typeof useCurrentContext>["currentContext"]) {
  if (!context) {
    return "No current context yet.";
  }

  return [
    `Intent: ${context.activeIntent || "unknown"}`,
    `Life feeling: ${context.lifeRating || "unknown"}`,
    `Main area: ${context.mainLifeArea || "unknown"}`,
    `Repeating pattern: ${context.repeatingPattern || "unknown"}`,
    `Support need: ${context.supportNeed || "unknown"}`,
    `Current focus: ${context.currentFocusSummary || "unknown"}`,
  ].join("\n");
}

function tryParseSelection(value: unknown): SelectionResponse | null {
  try {
    if (typeof value === "string") {
      return JSON.parse(value) as SelectionResponse;
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

    return JSON.parse(text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim()) as SelectionResponse;
  } catch {
    return null;
  }
}

function buildCandidates(answeredIds: string[]) {
  return followUpQuestionPool.filter((question) => !answeredIds.includes(question.id));
}

function fallbackQuestion(candidates: FollowUpQuestion[]) {
  return candidates[0] ?? null;
}

function normalizeFollowUpAnswers(
  answers: Array<{
    questionId: string;
    question: string;
    answer: string;
  }>,
) {
  const seen = new Set<string>();

  return answers.filter((item) => {
    if (seen.has(item.questionId)) {
      return false;
    }

    seen.add(item.questionId);
    return true;
  });
}

export function useOnboardingFollowUpEngine() {
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const { user, updateUser } = useUser();
  const { signals } = useAstrology();
  const { memoryEvents, addMemoryEvent } = useMemory();

  const getSession = () => ({
    answers: normalizeFollowUpAnswers(currentContext?.followUpAnswers ?? []),
    summary: currentContext?.followUpSummary ?? "",
    isComplete:
      normalizeFollowUpAnswers(currentContext?.followUpAnswers ?? []).length >= FOLLOW_UP_TARGET_COUNT,
  });

  const getNextQuestion = async (
    existingAnswers = currentContext?.followUpAnswers ?? [],
  ) => {
    const normalizedAnswers = normalizeFollowUpAnswers(existingAnswers);
    const answeredIds = normalizedAnswers.map((answer) => answer.questionId);
    const candidates = buildCandidates(answeredIds);
    if (candidates.length === 0 || answeredIds.length >= FOLLOW_UP_TARGET_COUNT) {
      return {
        question: null,
        questionText: "Rah has enough context to begin with real depth.",
      };
    }

    const chartSummary = signals.slice(0, 2).map((signal) => `${signal.planet}: ${signal.signalType}`).join(" | ");
    const memorySummary = memoryEvents.slice(0, 2).map((event) => `${event.title}: ${event.description}`).join(" | ");
    const candidateSummary = candidates
      .map((candidate) => `- ${candidate.id}: ${candidate.question}${candidate.options ? ` [${candidate.options.map((option) => option.label).join(", ")}]` : ""}`)
      .join("\n");

    try {
      const prompt = `
${intakePrePrompt.trim()}

User:
${user?.name ?? "Aryan"}

Structured context:
${formatCurrentSeed(currentContext)}

Existing follow-up answers:
${normalizedAnswers.map((answer) => `- ${answer.question}: ${answer.answer}`).join("\n") || "None yet."}

Recent memory:
${memorySummary || "No memory context yet."}

Astrology signal snapshot:
${chartSummary || "No chart signal yet."}

Candidate questions:
${candidateSummary}
`.trim();

      const raw = await sendPrompt(prompt);
      const parsed = tryParseSelection(raw);
      const next = candidates.find((candidate) => candidate.id === parsed?.nextQuestionId) ?? fallbackQuestion(candidates);

      return {
        question: next,
        questionText: parsed?.overrideQuestion?.trim() || next?.question || "",
      };
    } catch {
      const next = fallbackQuestion(candidates);
      return {
        question: next,
        questionText: next?.question || "",
      };
    }
  };

  const submitAnswer = async (question: FollowUpQuestion, answer: string) => {
    const nextAnswers = normalizeFollowUpAnswers([
      ...(currentContext?.followUpAnswers ?? []),
      {
        questionId: question.id,
        question: question.question,
        answer,
      },
    ]);

    await updateCurrentContext({
      followUpAnswers: nextAnswers,
    });

    await addMemoryEvent({
      title: `Follow-up: ${question.category}`,
      description: answer,
      date: new Date().toISOString().slice(0, 10),
      type: "onboarding_followup",
      tags: ["onboarding", "follow-up", question.id, question.category],
    });

    if (nextAnswers.length >= FOLLOW_UP_TARGET_COUNT) {
      const summary = [
        currentContext?.currentFocusSummary,
        ...nextAnswers.map((item) => `${item.question} ${item.answer}`),
      ]
        .filter(Boolean)
        .join(" ");

      await updateCurrentContext({
        followUpAnswers: nextAnswers,
        followUpSummary: summary,
        setupCompleted: true,
      });

      await updateUser({
        onboardingCompleted: true,
      });

      return {
        isComplete: true,
        summary,
      };
    }

    const nextQuestion = await getNextQuestion(nextAnswers);
    return {
      isComplete: false,
      nextQuestion,
    };
  };

  return {
    getSession,
    getNextQuestion,
    submitAnswer,
  };
}
