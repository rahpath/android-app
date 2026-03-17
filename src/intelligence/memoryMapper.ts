import { getIntakeQuestionById } from "@/config/intakeQuestionPool";
import type { IntakeAnswer, MemoryEvent } from "@/types/domain";

const getAnswerText = (answer: IntakeAnswer["answer"]) => {
  if (typeof answer === "string") {
    return answer.trim();
  }

  if (Array.isArray(answer)) {
    return answer.join(", ").trim();
  }

  return [answer.birthDate, answer.birthTime, answer.birthLocation]
    .filter(Boolean)
    .join(" | ")
    .trim();
};

const memoryConfigByCategory: Record<string, { title: string; type: string; tags: string[] }> = {
  emotional_signal: {
    title: "Current emotional climate",
    type: "emotional_state",
    tags: ["intake", "intake_context", "emotional-signal"],
  },
  career: {
    title: "Career uncertainty",
    type: "career_uncertainty",
    tags: ["intake", "intake_context", "career"],
  },
  relationships: {
    title: "Relationship tension",
    type: "relationship_pattern",
    tags: ["intake", "intake_context", "relationships"],
  },
  purpose: {
    title: "Purpose confusion",
    type: "purpose_search",
    tags: ["intake", "intake_context", "purpose"],
  },
  money: {
    title: "Money pressure",
    type: "money_stress",
    tags: ["intake", "intake_context", "money"],
  },
  family: {
    title: "Family pattern",
    type: "family_dynamic",
    tags: ["intake", "intake_context", "family"],
  },
  health: {
    title: "Energy and health strain",
    type: "health_pattern",
    tags: ["intake", "intake_context", "health"],
  },
  other: {
    title: "Core tension",
    type: "life_tension",
    tags: ["intake", "intake_context", "other"],
  },
  reflection: {
    title: "Current inner inquiry",
    type: "self_reflection",
    tags: ["intake", "intake_context", "reflection"],
  },
  support_style: {
    title: "What support feels needed",
    type: "support_need",
    tags: ["intake", "intake_context", "support"],
  },
};

export function mapIntakeAnswersToMemoryEvents(
  answers: IntakeAnswer[],
): Omit<MemoryEvent, "id" | "createdAt">[] {
  const today = new Date().toISOString().slice(0, 10);

  return answers
    .filter((answer) => answer.questionId !== "birth_data")
    .map((answer) => {
      const question = getIntakeQuestionById(answer.questionId);
      const config = memoryConfigByCategory[question?.category ?? "reflection"]
        ?? memoryConfigByCategory.reflection;

      return {
        title: config.title,
        description: getAnswerText(answer.answer),
        date: today,
        type: config.type,
        tags: [...config.tags, answer.questionId],
      };
    });
}
