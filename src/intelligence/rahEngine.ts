import { useDecision, useInsights, useMemory } from "@/context";
import { buildPrompt } from "@/intelligence/promptBuilder";
import { parseDecisionResponse, parseResponse } from "@/intelligence/responseParser";
import { useSupremeContext } from "@/intelligence/supremeContext";
import { isQuotaExceededError, sendPrompt } from "@/services/aiClient";
import type { DecisionInsightSections, DecisionRecord, DecisionUrgency, Insight } from "@/types/domain";

const gracefulFallback =
  "Rah is thinking about this right now. Please try again in a moment.";

const quotaFallback =
  "Rah has hit the current Gemini free-tier limit for the moment, so this read is coming from your local context layer instead.";

const getLocalDateKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useRahEngine() {
  const supremeContext = useSupremeContext();
  const { addMemoryEvent } = useMemory();
  const { addDecision, updateDecision } = useDecision();
  const { addInsight, upsertInsight, getLatestInsight } = useInsights();
  const {
    userProfile: user,
    memoryEvents,
    astrologySignals: signals,
    currentContext,
    natalChart,
    recentInsights: insights,
    recentDecisions,
  } = supremeContext;

  const detectQuestionMode = (question: string) => {
    const normalized = question.toLowerCase();
    const decisionKeywords = [
      "should i",
      "should we",
      "decide",
      "decision",
      "choose",
      "leave",
      "stay",
      "take this",
      "move",
      "offer",
      "break up",
      "quit",
    ];

    return decisionKeywords.some((keyword) => normalized.includes(keyword))
      ? "decision_insight"
      : "ask_rah";
  };

  const buildLocalDecisionFallback = (payload: {
    title: string;
    situation: string;
    options: string[];
    desiredOutcome: string;
    biggestFear: string;
    urgency: DecisionUrgency;
  }) => {
    const lifeArea = currentContext?.mainLifeArea || "life";
    const pattern = currentContext?.repeatingPattern || "the pattern Rah has been mapping";
    const signal = signals[0]?.signalType || "reflection";
    const fear = payload.biggestFear || "the possibility of making the wrong move";
    const desired = payload.desiredOutcome || "clarity";

    const sections: DecisionInsightSections = {
      coreTension: `This looks less like a simple yes-or-no decision and more like a tension between ${desired.toLowerCase()} and ${fear.toLowerCase()}. In your current ${lifeArea.toLowerCase()} landscape, Rah keeps seeing ${pattern.toLowerCase()} underneath the surface.`,
      supportsAction: `Action is supported if one option gives you more honesty, relief, or momentum instead of just temporary escape. The current signal around ${signal.toLowerCase()} suggests something wants to become clearer through movement, not only overthinking.`,
      suggestsWaiting: `Waiting may be wiser if the urgency is being created by fear, pressure from other people, or the need to stop discomfort immediately. If the clearest option still feels blurred, slowing down briefly could protect you from acting from contraction.`,
      blindSpot: `The blind spot may be treating certainty as the same thing as alignment. Rah's local read is that the emotional weight around this choice may be louder than the actual truth of which path fits you better.`,
      nextMove: `Take the top two options and ask: which one creates more self-respect, not just less anxiety? Then give that option one concrete next step within the next ${payload.urgency === "right_now" ? "24 hours" : payload.urgency === "soon" ? "3 days" : "week"}.`,
    };

    return {
      content: `${quotaFallback} ${sections.coreTension} ${sections.nextMove}`,
      sections,
    };
  };

  const buildLocalChatFallback = (question: string, mode: "ask_rah" | "decision_insight") => {
    if (mode === "decision_insight") {
      return `${quotaFallback} Rah still sees this as a decision that should be slowed down just enough to separate fear from alignment. Bring the clearest option back into focus, notice what you want to protect, and test one honest next step instead of trying to solve the whole future at once.`;
    }

    const pattern = currentContext?.repeatingPattern || "the emotional pattern Rah has been mapping";
    const lifeArea = currentContext?.mainLifeArea || "your life";
    return `${quotaFallback} Based on your current ${lifeArea.toLowerCase()} context and ${pattern.toLowerCase()}, Rah would stay with the emotional thread inside your question first, because that usually reveals more than the surface story does.`;
  };

  const buildOutcomeReflection = (payload: {
    title: string;
    chosenOption: string;
    outcomeSummary: string;
    emotionalOutcome: string;
    wouldChooseAgain: "yes" | "no" | "unsure" | "";
  }) => {
    const pattern = currentContext?.repeatingPattern || "the pattern Rah has been mapping";
    const chooseAgainText =
      payload.wouldChooseAgain === "yes"
        ? "You would choose this again, which suggests the outcome brought some real alignment."
        : payload.wouldChooseAgain === "no"
          ? "You would not choose this again, which tells Rah this result taught you something important about what is not sustainable."
          : "You still feel mixed about the result, which usually means the lesson is still unfolding.";

    return `After ${payload.chosenOption.toLowerCase()}, the outcome landed as: ${payload.outcomeSummary}. Emotionally it felt like ${payload.emotionalOutcome.toLowerCase()}. ${chooseAgainText} Rah will now hold this next to ${pattern.toLowerCase()} when reading future decisions around ${payload.title.toLowerCase()}.`;
  };

  const generateDailyInsight = async (): Promise<Insight> => {
    const cachedDailyInsight = getLatestInsight("daily_insight");
    if (
      cachedDailyInsight
      && getLocalDateKey(new Date(cachedDailyInsight.createdAt)) === getLocalDateKey()
    ) {
      return cachedDailyInsight;
    }

    try {
      const prompt = buildPrompt({
        supremeContext,
        userProfile: user,
        memoryEvents,
        astrologySignals: signals,
        currentContext,
        natalChart,
        insightType: "daily_insight",
        existingInsights: insights,
      });
      const rawResponse = await sendPrompt(prompt);
      const parsedInsight = parseResponse(rawResponse, "daily_insight");
      return await upsertInsight(parsedInsight);
    } catch (error) {
      const content = isQuotaExceededError(error)
        ? `${quotaFallback} Rah is using your saved chart and context to hold today gently until Gemini is available again.`
        : gracefulFallback;
      return await upsertInsight({
        type: "daily_insight",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      });
    }
  };

  const askRah = async (question: string): Promise<{ insight: Insight; mode: "ask_rah" | "decision_insight" }> => {
    const mode = detectQuestionMode(question);

    try {
      const prompt = buildPrompt({
        supremeContext,
        userProfile: user,
        memoryEvents,
        astrologySignals: signals,
        currentContext,
        natalChart,
        userQuestion: question,
        insightType: mode,
        existingInsights: insights,
      });
      const rawResponse = await sendPrompt(prompt);
      const parsedInsight = parseResponse(rawResponse, mode);
      const savedInsight = await addInsight(parsedInsight);

      await addMemoryEvent({
        title: question,
        description: savedInsight.content,
        date: getLocalDateKey(),
        type: "conversation",
        tags: ["ask-rah", "chat", mode === "decision_insight" ? "decision" : "reflection"],
      });

      return {
        insight: savedInsight,
        mode,
      };
    } catch (error) {
      const content = isQuotaExceededError(error)
        ? buildLocalChatFallback(question, mode)
        : gracefulFallback;
      const fallbackInsight: Insight = {
        id: `fallback-chat-${Date.now()}`,
        type: mode,
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      };

      await addMemoryEvent({
        title: question,
        description: fallbackInsight.content,
        date: getLocalDateKey(),
        type: "conversation",
        tags: ["ask-rah", "chat", "fallback", mode === "decision_insight" ? "decision" : "reflection"],
      });

      return {
        insight: fallbackInsight,
        mode,
      };
    }
  };

  const generatePatternInsight = async (): Promise<Insight> => {
    try {
      const prompt = buildPrompt({
        supremeContext,
        userProfile: user,
        memoryEvents,
        astrologySignals: signals,
        currentContext,
        natalChart,
        insightType: "pattern_insight",
        existingInsights: insights,
      });
      const rawResponse = await sendPrompt(prompt);
      const parsedInsight = parseResponse(rawResponse, "pattern_insight");
      return await upsertInsight(parsedInsight);
    } catch (error) {
      const content = isQuotaExceededError(error)
        ? `${quotaFallback} Rah is using pattern memory and current context to sketch the outline until live AI comes back.`
        : gracefulFallback;
      return await upsertInsight({
        type: "pattern_insight",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      });
    }
  };

  const getHoursSinceInsight = (type: string) => {
    const latest = getLatestInsight(type);
    if (!latest) {
      return Infinity;
    }

    return (Date.now() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60);
  };

  const generateContextualInsight = async (
    insightType:
      | "current_insight"
      | "relationship_insight"
      | "career_insight"
      | "timing_insight",
  ): Promise<Insight> => {
    try {
      const prompt = buildPrompt({
        supremeContext,
        userProfile: user,
        memoryEvents,
        astrologySignals: signals,
        currentContext,
        natalChart,
        insightType,
        existingInsights: insights,
      });
      const rawResponse = await sendPrompt(prompt);
      const parsedInsight = parseResponse(rawResponse, insightType);
      return await upsertInsight(parsedInsight);
    } catch (error) {
      const content = isQuotaExceededError(error)
        ? `${quotaFallback} Rah is using your saved chart, patterns, and current context to sketch this ${insightType.replace(/_/g, " ")}.`
        : gracefulFallback;

      const fallbackInsight: Insight = {
        id: `fallback-${insightType}-${Date.now()}`,
        type: insightType,
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      };

      return await upsertInsight(fallbackInsight);
    }
  };

  const generateHomeIntelligence = async () => {
    const jobs: Array<() => Promise<Insight>> = [];

    if (getHoursSinceInsight("daily_insight") >= 24) {
      jobs.push(() => generateDailyInsight());
    }

    if (getHoursSinceInsight("current_insight") >= 6) {
      jobs.push(() => generateContextualInsight("current_insight"));
    }

    if (getHoursSinceInsight("timing_insight") >= 3) {
      jobs.push(() => generateContextualInsight("timing_insight"));
    }

    if (getHoursSinceInsight("pattern_insight") >= 24) {
      jobs.push(() => generatePatternInsight());
    }

    const relationshipRelevant = currentContext?.mainLifeArea === "relationships"
      || currentContext?.activeIntent === "relationship_clarity";
    if (relationshipRelevant && getHoursSinceInsight("relationship_insight") >= 12) {
      jobs.push(() => generateContextualInsight("relationship_insight"));
    }

    const careerRelevant = currentContext?.mainLifeArea === "career"
      || currentContext?.activeIntent === "career_direction";
    if (careerRelevant && getHoursSinceInsight("career_insight") >= 12) {
      jobs.push(() => generateContextualInsight("career_insight"));
    }

    const generated: Insight[] = [];

    for (const job of jobs) {
      generated.push(await job());
    }

    return generated;
  };

  const generateDecisionInsight = async (payload: {
    title: string;
    situation: string;
    options: string[];
    desiredOutcome: string;
    biggestFear: string;
    urgency: DecisionUrgency;
  }): Promise<{ insight: Insight; decision: DecisionRecord | null; sections: DecisionInsightSections }> => {
    const createdDecision = await addDecision({
      ...payload,
      status: "draft",
      decisionPulse: "clarify",
      nextMove: "",
      latestInsight: "",
      latestSections: null,
      chosenOption: "",
      outcomeSummary: "",
      emotionalOutcome: "",
      wouldChooseAgain: "",
      outcomeLoggedAt: "",
    });

    try {
      const prompt = buildPrompt({
        supremeContext: {
          ...supremeContext,
          recentDecisions: [createdDecision, ...recentDecisions].slice(0, 3),
        },
        userProfile: user,
        memoryEvents,
        astrologySignals: signals,
        currentContext,
        natalChart,
        userQuestion: `Help me think through this decision: ${payload.title}`,
        insightType: "decision_insight",
        existingInsights: insights,
        decisionRecord: createdDecision,
      });

      const rawResponse = await sendPrompt(prompt);
      const parsed = parseDecisionResponse(rawResponse);
      const savedInsight = await addInsight(parsed.insight);

      const updatedDecision = await updateDecision(createdDecision.id, {
        status: "analyzed",
        decisionPulse: parsed.sections.decisionPulse || "clarify",
        nextMove: parsed.sections.nextMove,
        latestInsight: savedInsight.content,
        latestSections: parsed.sections,
      });

      await addMemoryEvent({
        title: `Decision: ${payload.title}`,
        description: `${payload.situation}\n\nRah's read: ${savedInsight.content}`,
        date: getLocalDateKey(),
        type: "decision",
        tags: ["decision-studio", payload.urgency, ...payload.options.map((option) => option.toLowerCase().replace(/\s+/g, "_"))],
      });

      return {
        insight: savedInsight,
        decision: updatedDecision,
        sections: parsed.sections,
      };
    } catch (error) {
      const localFallback = buildLocalDecisionFallback(payload);
      const fallbackInsight: Insight = {
        id: `fallback-decision-${Date.now()}`,
        type: "decision_insight",
        content: isQuotaExceededError(error) ? localFallback.content : gracefulFallback,
        createdAt: new Date().toISOString(),
        source: "system",
      };

      const updatedDecision = await updateDecision(createdDecision.id, {
        status: "analyzed",
        decisionPulse: isQuotaExceededError(error) ? "clarify" : "clarify",
        nextMove: isQuotaExceededError(error) ? localFallback.sections.nextMove : "Come back to the clearest option and name one honest next step.",
        latestInsight: fallbackInsight.content,
        latestSections: isQuotaExceededError(error)
          ? localFallback.sections
          : {
              decisionPulse: "clarify",
              coreTension: "Rah can feel the tension in this choice, but needs another moment to fully map it.",
              supportsAction: "Some momentum exists, even if the timing is still fuzzy.",
              suggestsWaiting: "Pausing briefly could keep anxiety from making the choice for you.",
              blindSpot: "Fear may be sounding more certain than truth right now.",
              nextMove: "Come back to the clearest option and name one honest next step.",
            },
      });

      await addMemoryEvent({
        title: `Decision: ${payload.title}`,
        description: `${payload.situation}\n\nRah's read: ${fallbackInsight.content}`,
        date: getLocalDateKey(),
        type: "decision",
        tags: ["decision-studio", "fallback", payload.urgency],
      });

      return {
        insight: fallbackInsight,
        decision: updatedDecision,
        sections: isQuotaExceededError(error)
          ? localFallback.sections
          : {
              coreTension: "Rah can feel the tension in this choice, but needs another moment to fully map it.",
              supportsAction: "Some momentum exists, even if the timing is still fuzzy.",
              suggestsWaiting: "Pausing briefly could keep anxiety from making the choice for you.",
              blindSpot: "Fear may be sounding more certain than truth right now.",
              nextMove: "Come back to the clearest option and name one honest next step.",
              decisionPulse: "clarify",
            },
      };
    }
  };

  return {
    generateDailyInsight,
    generateContextualInsight,
    generateHomeIntelligence,
    askRah,
    generatePatternInsight,
    generateDecisionInsight,
    logDecisionOutcome: async (payload: {
      decisionId: string;
      title: string;
      chosenOption: string;
      outcomeSummary: string;
      emotionalOutcome: string;
      wouldChooseAgain: "yes" | "no" | "unsure" | "";
    }) => {
      const reflection = buildOutcomeReflection(payload);

      const updatedDecision = await updateDecision(payload.decisionId, {
        status: "outcome_logged",
        chosenOption: payload.chosenOption,
        outcomeSummary: payload.outcomeSummary,
        emotionalOutcome: payload.emotionalOutcome,
        wouldChooseAgain: payload.wouldChooseAgain,
        outcomeLoggedAt: new Date().toISOString(),
        latestInsight: reflection,
      });

      await addMemoryEvent({
        title: `Outcome: ${payload.title}`,
        description: `${payload.chosenOption}\n${payload.outcomeSummary}\nEmotional result: ${payload.emotionalOutcome}\nRah learned: ${reflection}`,
        date: getLocalDateKey(),
        type: "decision_outcome",
        tags: [
          "decision-outcome",
          payload.wouldChooseAgain || "unsure",
          payload.chosenOption.toLowerCase().replace(/\s+/g, "_"),
        ],
      });

      const insight = await addInsight({
        type: "decision_outcome_insight",
        content: reflection,
        createdAt: new Date().toISOString(),
        source: "system",
      });

      return {
        decision: updatedDecision,
        insight,
      };
    },
  };
}
