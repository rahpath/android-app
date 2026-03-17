import { prePrompt } from "@/intelligence/prePrompt";
import type {
  AstrologySignal,
  CurrentContextState,
  DecisionRecord,
  Insight,
  MemoryEvent,
  NatalChart,
  SupremeContext,
  UserProfile,
} from "@/types/domain";

type BuildPromptInput = {
  supremeContext?: SupremeContext | null;
  userProfile: UserProfile | null;
  memoryEvents: MemoryEvent[];
  astrologySignals: AstrologySignal[];
  currentContext?: CurrentContextState | null;
  natalChart?: NatalChart | null;
  userQuestion?: string;
  insightType:
    | "daily_insight"
    | "current_insight"
    | "ask_rah"
    | "pattern_insight"
    | "relationship_insight"
    | "career_insight"
    | "timing_insight"
    | "decision_insight";
  existingInsights?: Insight[];
  decisionRecord?: DecisionRecord | null;
};

const formatMemories = (memoryEvents: MemoryEvent[]) => {
  if (memoryEvents.length === 0) {
    return "- No stored memories yet.";
  }

  return memoryEvents
    .slice(0, 6)
    .map(
      (event) =>
        `- ${event.title} (${event.type}, ${event.date}): ${event.description}`,
    )
    .join("\n");
};

const formatSignals = (signals: AstrologySignal[]) => {
  if (signals.length === 0) {
    return "- No astrology signals available.";
  }

  return signals
    .map(
      (signal) =>
        `- ${signal.planet}: ${signal.signalType} (${signal.strength})${signal.relatedPlacement ? ` [${signal.relatedPlacement}]` : ""} - ${signal.description}`,
    )
    .join("\n");
};

const formatInsights = (insights: Insight[]) => {
  if (insights.length === 0) {
    return "- No prior insights stored.";
  }

  return insights
    .slice(0, 3)
    .map((insight) => `- ${insight.type}: ${insight.content}`)
    .join("\n");
};

const formatCurrentContext = (currentContext: CurrentContextState | null | undefined) => {
  if (!currentContext) {
    return "- No structured life context stored yet.";
  }

  const rows = [
    currentContext.activeIntent
      ? `- Active intent: ${currentContext.activeIntent.replace(/_/g, " ")}`
      : null,
    currentContext.lifeRating ? `- Life feeling: ${currentContext.lifeRating}` : null,
    currentContext.mainLifeArea ? `- Main life area: ${currentContext.mainLifeArea}` : null,
    currentContext.repeatingPattern
      ? `- Repeating pattern: ${currentContext.repeatingPattern}`
      : null,
    currentContext.supportNeed ? `- Support need: ${currentContext.supportNeed}` : null,
    currentContext.currentFocusSummary
      ? `- Current focus summary: ${currentContext.currentFocusSummary}`
      : null,
    currentContext.followUpAnswers?.length
      ? `- Adaptive follow-up answers: ${currentContext.followUpAnswers.map((item) => `${item.question} -> ${item.answer}`).join(" | ")}`
      : null,
    currentContext.followUpSummary
      ? `- Follow-up summary: ${currentContext.followUpSummary}`
      : null,
  ].filter(Boolean);

  return rows.length > 0 ? rows.join("\n") : "- No structured life context stored yet.";
};

const formatChart = (natalChart: NatalChart | null | undefined) => {
  if (!natalChart) {
    return "- Natal chart not ready yet.";
  }

  const rows = [
    `- Summary: ${natalChart.summary}`,
    natalChart.corePlacements.sun
      ? `- Sun: ${natalChart.corePlacements.sun.signLabel} ${natalChart.corePlacements.sun.degreeWithinSign}`
      : null,
    natalChart.corePlacements.moon
      ? `- Moon: ${natalChart.corePlacements.moon.signLabel} ${natalChart.corePlacements.moon.degreeWithinSign}`
      : null,
    natalChart.corePlacements.rising
      ? `- Rising: ${natalChart.corePlacements.rising.signLabel} ${natalChart.corePlacements.rising.degreeWithinSign}`
      : "- Rising: unknown because birth time is missing",
  ].filter(Boolean);

  return rows.join("\n");
};

const formatDecisions = (
  recentDecisions: DecisionRecord[],
  decisionRecord?: DecisionRecord | null,
) => {
  const rows: string[] = [];

  if (decisionRecord) {
    rows.push(
      [
        `- Current decision: ${decisionRecord.title}`,
        `- Situation: ${decisionRecord.situation}`,
        `- Options: ${decisionRecord.options.join(" | ") || "None listed"}`,
        `- Desired outcome: ${decisionRecord.desiredOutcome || "Unknown"}`,
        `- Biggest fear: ${decisionRecord.biggestFear || "Unknown"}`,
        `- Urgency: ${decisionRecord.urgency.replace(/_/g, " ")}`,
        `- Chosen option: ${decisionRecord.chosenOption || "Not logged yet"}`,
        `- Outcome summary: ${decisionRecord.outcomeSummary || "Not logged yet"}`,
        `- Emotional outcome: ${decisionRecord.emotionalOutcome || "Not logged yet"}`,
        `- Would choose again: ${decisionRecord.wouldChooseAgain || "Unknown"}`,
      ].join("\n"),
    );
  }

  if (recentDecisions.length > 0) {
    rows.push(
      recentDecisions
        .slice(0, 3)
        .map(
          (decision) =>
            `- Recent decision: ${decision.title} (${decision.urgency.replace(/_/g, " ")}) -> ${decision.latestInsight || "No analysis yet."}${decision.outcomeSummary ? ` Outcome: ${decision.outcomeSummary}` : ""}`,
        )
        .join("\n"),
    );
  }

  return rows.join("\n") || "- No decision context stored yet.";
};

export function buildPrompt({
  supremeContext,
  userProfile,
  memoryEvents,
  astrologySignals,
  currentContext,
  natalChart,
  userQuestion,
  insightType,
  existingInsights = [],
  decisionRecord,
}: BuildPromptInput) {
  const taskMap = {
    daily_insight:
      "Create one grounded daily insight rooted in current emotional patterns and stored context.",
    current_insight:
      "Explain what feels most active in the user's life right now using current context, memory, and astrology.",
    ask_rah:
      "Answer the user's question with reflective insight grounded in their context.",
    pattern_insight:
      "Explain a recurring life pattern emerging from the user's memories and signals.",
    relationship_insight:
      "Explain what is currently active in the user's relationship and connection dynamics using memory, context, and astrology.",
    career_insight:
      "Explain what is currently active in the user's career or purpose direction using memory, context, and astrology.",
    timing_insight:
      "Explain the timing and energetic climate of the current moment using astrology, context, and memory.",
    decision_insight:
      "Analyze the user's decision through astrology timing, emotional patterns, lived context, and practical tradeoffs. Give a grounded next-step reflection, not a deterministic command.",
  };

  const now = new Date();
  const currentTimeContext = [
    `- ISO timestamp: ${now.toISOString()}`,
    `- Local date string: ${now.toDateString()}`,
    `- Local time string: ${now.toTimeString()}`,
  ].join("\n");

  const outputFormat =
    insightType === "decision_insight"
      ? `Return only valid JSON with this exact structure:
{
  "type": "decision_insight",
  "decisionPulse": "move | wait | clarify",
  "coreTension": "What this decision is really about.",
  "supportsAction": "What supports action now.",
  "suggestsWaiting": "What suggests waiting or slowing down.",
  "blindSpot": "What the user may not be seeing clearly.",
  "nextMove": "The most aligned next move.",
  "content": "A concise combined summary of the decision read.",
  "source": "gemini"
}`
      : `Return only valid JSON with this exact structure:
{
  "type": "${insightType}",
  "content": "One reflective response in plain text.",
  "source": "gemini"
}`;

  return `
System:
${prePrompt.trim()}

User Context:
Name: ${userProfile?.name ?? "Aryan"}
User ID: ${userProfile?.id ?? "aryan"}
Birth Date: ${userProfile?.birthDate || "Unknown"}
Birth Time: ${userProfile?.birthTime || "Unknown"}
Birth Location: ${userProfile?.birthLocation || "Unknown"}

Supreme Context Summary:
${supremeContext?.supremeSummary || "No supreme context summary available yet."}

Structured Current Context:
${formatCurrentContext(currentContext ?? supremeContext?.currentContext)}

Natal Chart Context:
${formatChart(natalChart ?? supremeContext?.natalChart)}

Current Time Context:
${currentTimeContext}

Recent Memories:
${formatMemories(memoryEvents)}

Astrology Signals:
${formatSignals(astrologySignals)}

Stored Insights:
${formatInsights(existingInsights)}

Decision Context:
${formatDecisions(supremeContext?.recentDecisions ?? [], decisionRecord)}

User Question:
${userQuestion?.trim() || "No direct question. Generate a contextual insight."}

Task:
${taskMap[insightType]}

Output Format:
${outputFormat}
`.trim();
}
