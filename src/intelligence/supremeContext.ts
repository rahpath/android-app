import { useAstrology, useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import type { SupremeContext } from "@/types/domain";

function buildSupremeSummary(context: SupremeContext) {
  const parts = [
    context.userProfile?.name ? `User is ${context.userProfile.name}.` : null,
    context.natalChart?.summary ? `Chart: ${context.natalChart.summary}.` : null,
    context.currentContext?.activeIntent
      ? `Active intent: ${context.currentContext.activeIntent.replace(/_/g, " ")}.`
      : null,
    context.currentContext?.mainLifeArea
      ? `Main life area under pressure: ${context.currentContext.mainLifeArea}.`
      : null,
    context.currentContext?.repeatingPattern
      ? `Current repeating pattern: ${context.currentContext.repeatingPattern}.`
      : null,
    context.currentContext?.followUpSummary
      ? `Follow-up context: ${context.currentContext.followUpSummary}.`
      : null,
    context.memoryEvents[0]
      ? `Most recent memory: ${context.memoryEvents[0].title} - ${context.memoryEvents[0].description}.`
      : null,
    context.recentInsights[0]
      ? `Latest insight: ${context.recentInsights[0].content}.`
      : null,
    context.recentDecisions[0]
      ? `Active decision: ${context.recentDecisions[0].title} with urgency ${context.recentDecisions[0].urgency.replace(/_/g, " ")}.`
      : null,
    context.recentDecisions[0]?.outcomeSummary
      ? `Latest decision outcome: ${context.recentDecisions[0].outcomeSummary}.`
      : null,
  ].filter(Boolean);

  return parts.join(" ");
}

export function useSupremeContext(): SupremeContext {
  const { user } = useUser();
  const { natalChart, signals } = useAstrology();
  const { currentContext } = useCurrentContext();
  const { memoryEvents } = useMemory();
  const { decisions } = useDecision();
  const { insights } = useInsights();

  const baseContext: SupremeContext = {
    userProfile: user,
    natalChart,
    astrologySignals: signals,
    currentContext,
    memoryEvents,
    recentInsights: insights.slice(0, 5),
    recentDecisions: decisions.slice(0, 3),
    supremeSummary: "",
  };

  return {
    ...baseContext,
    supremeSummary: buildSupremeSummary(baseContext),
  };
}
