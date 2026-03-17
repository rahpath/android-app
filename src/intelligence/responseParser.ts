import type { DecisionInsightSections, Insight } from "@/types/domain";

type ParsedInsight = Omit<Insight, "id">;

const extractResponseText = (rawResponse: unknown) => {
  if (typeof rawResponse === "string") {
    return rawResponse;
  }

  if (typeof rawResponse !== "object" || rawResponse === null) {
    return "";
  }

  const response = rawResponse as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
    ?? "";
};

const stripCodeFences = (value: string) =>
  value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

export function parseResponse(
  rawResponse: unknown,
  fallbackType: Insight["type"],
): ParsedInsight {
  const responseText = stripCodeFences(extractResponseText(rawResponse));
  const createdAt = new Date().toISOString();

  try {
    const parsed = JSON.parse(responseText) as Partial<ParsedInsight>;
    return {
      type: parsed.type ?? fallbackType,
      content: parsed.content?.trim() || "Rah is still shaping this insight.",
      createdAt,
      source: parsed.source?.trim() || "gemini",
    };
  } catch {
    return {
      type: fallbackType,
      content: responseText || "Rah is still shaping this insight.",
      createdAt,
      source: "gemini",
    };
  }
}

export function parseDecisionResponse(rawResponse: unknown): {
  insight: ParsedInsight;
  sections: DecisionInsightSections;
} {
  const responseText = stripCodeFences(extractResponseText(rawResponse));
  const createdAt = new Date().toISOString();

  const fallbackSections: DecisionInsightSections = {
    decisionPulse: "clarify",
    coreTension: "Rah is still reading what this decision is really about.",
    supportsAction: "Some part of you is ready to move when the picture sharpens.",
    suggestsWaiting: "Take a breath before treating urgency like destiny.",
    blindSpot: "You may be underestimating the emotional pattern attached to this choice.",
    nextMove: "Name the option that feels most aligned and test it with one honest next step.",
  };

  try {
    const parsed = JSON.parse(responseText) as Partial<ParsedInsight & DecisionInsightSections>;
    const sections: DecisionInsightSections = {
      decisionPulse:
        parsed.decisionPulse === "move" || parsed.decisionPulse === "wait" || parsed.decisionPulse === "clarify"
          ? parsed.decisionPulse
          : fallbackSections.decisionPulse,
      coreTension: parsed.coreTension?.trim() || fallbackSections.coreTension,
      supportsAction: parsed.supportsAction?.trim() || fallbackSections.supportsAction,
      suggestsWaiting: parsed.suggestsWaiting?.trim() || fallbackSections.suggestsWaiting,
      blindSpot: parsed.blindSpot?.trim() || fallbackSections.blindSpot,
      nextMove: parsed.nextMove?.trim() || fallbackSections.nextMove,
    };

    const content =
      parsed.content?.trim()
      || [
        sections.coreTension,
        sections.supportsAction,
        sections.suggestsWaiting,
        sections.blindSpot,
        sections.nextMove,
      ].join(" ");

    return {
      insight: {
        type: parsed.type ?? "decision_insight",
        content,
        createdAt,
        source: parsed.source?.trim() || "gemini",
      },
      sections,
    };
  } catch {
    return {
      insight: {
        type: "decision_insight",
        content: responseText || "Rah is still shaping this decision read.",
        createdAt,
        source: "gemini",
      },
      sections: fallbackSections,
    };
  }
}
