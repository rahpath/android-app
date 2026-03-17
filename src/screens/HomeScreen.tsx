import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getChartConfidenceText } from "@/astrology/chartNarratives";
import { ChartRevealCard } from "@/components/chart/ChartRevealCard";
import { FeatureCard } from "@/components/cards/FeatureCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { SignalBadge } from "@/components/home/SignalBadge";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology, useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import { theme } from "@/theme/theme";

export function HomeScreen() {
  const { user } = useUser();
  const { getLatestInsight } = useInsights();
  const { getPrimarySignal, chartReady, natalChart } = useAstrology();
  const { currentContext } = useCurrentContext();
  const { memoryEvents } = useMemory();
  const { getLatestDecision, getDecisionNeedingOutcome } = useDecision();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.birthDate || !user.birthLocation) {
      router.replace("/profile-setup");
      return;
    }

    if (!user.chartRevealed) {
      router.replace("/chart-reveal");
      return;
    }

    if (!user.onboardingCompleted) {
      if (!currentContext?.activeIntent) {
        router.replace("/intent-setup");
        return;
      }

      const hasContextSeed = Boolean(
        currentContext.lifeRating
          && currentContext.mainLifeArea
          && currentContext.repeatingPattern
          && currentContext.supportNeed,
      );

      router.replace(hasContextSeed ? "/context-deepen" : "/context-setup");
    }
  }, [currentContext, user]);

  const latestInsight = getLatestInsight("daily_insight");
  const currentInsight = getLatestInsight("current_insight");
  const timingInsight = getLatestInsight("timing_insight");
  const relationshipInsight = getLatestInsight("relationship_insight");
  const careerInsight = getLatestInsight("career_insight");
  const primarySignal = getPrimarySignal();
  const dailyMessage = latestInsight?.content
    ?? (primarySignal
      ? `Your ${primarySignal.signalType} is rising today.`
      : "Your path profile is still calibrating.");
  const contextSummary = currentContext?.setupCompleted
    ? `${currentContext.mainLifeArea || "Life"} feels most charged, and your path engine is tuned for ${currentContext.supportNeed || "clarity"}.`
    : "Finish setup so your present emotional and decision context can power every read.";
  const ritualPrompt = currentContext?.setupCompleted
    ? `Your path lens is holding ${currentContext.repeatingPattern || "your current pattern"} while today's signal leans toward ${primarySignal?.signalType || "reflection"}.`
    : "Complete setup to activate chart-timed daily rhythm across the app.";
  const recentMemory = memoryEvents[0] ?? null;
  const recentThread = memoryEvents.find((event) => event.tags.includes("ask-rah")) ?? null;
  const latestDecision = getLatestDecision();
  const decisionNeedingOutcome = getDecisionNeedingOutcome();
  const placementSummary = natalChart?.corePlacements;
  const decisionPulseLabel =
    latestDecision?.decisionPulse === "move"
      ? "Move gently"
      : latestDecision?.decisionPulse === "wait"
        ? "Wait and watch"
        : "Clarify first";
  const timingSummary = primarySignal
    ? `${primarySignal.planet} is amplifying ${primarySignal.signalType.toLowerCase()} right now.`
    : "Today's timing layer is still syncing with your chart and context.";
  const whatToNotice = latestDecision?.nextMove
    || currentContext?.followUpSummary
    || currentContext?.currentFocusSummary
    || "Keep noticing where your body softens versus tightens around the same choice.";

  const features = [
    {
      title: "Daily Insight",
      path: "/insight",
      subtitle: latestInsight ? "Latest insight available" : "Open feature",
    },
    { title: "Ask Rah", path: "/ask", subtitle: "Open feature" },
    {
      title: "Your Chart",
      path: "/chart",
      subtitle: chartReady ? "Sky map and placement meaning ready" : "Open feature",
    },
    { title: "Your Patterns", path: "/patterns", subtitle: getLatestInsight("pattern_insight") ? "Pattern theme mapped" : "Open feature" },
    { title: "Your Path", path: "/path", subtitle: careerInsight ? "Direction insight ready" : "Open feature" },
    {
      title: "Your Journey",
      path: "/journey",
      subtitle: chartReady ? `${memoryEvents.length} memories + chart context` : `${memoryEvents.length} memories stored`,
    },
    {
      title: "Decision Studio",
      path: "/decision",
      subtitle: decisionNeedingOutcome
        ? "Outcome check-in waiting"
        : latestDecision
          ? "Your latest decision is still active"
          : "Bring a real choice",
    },
    {
      title: "Relationships",
      path: "/relationships",
      subtitle: relationshipInsight ? "Relationship lens ready" : primarySignal ? primarySignal.description : "Open feature",
    },
  ] as const;

  return (
    <RahAppShell activePath="/home">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello {user?.name ?? "Aryan"}</Text>
          <Text style={styles.subtitle}>{dailyMessage}</Text>
        </View>

        <GlassPanel style={styles.contextPanel}>
          <Text style={styles.contextTitle}>Supreme Context</Text>
          <Text style={styles.contextText}>{contextSummary}</Text>
          {!currentContext?.setupCompleted ? (
            <Pressable onPress={() => router.push("/intent-setup")}>
              <Text style={styles.contextAction}>Finish context setup</Text>
            </Pressable>
          ) : null}
        </GlassPanel>

        <GlassPanel style={styles.ritualPanel}>
          <Text style={styles.ritualLabel}>Today With Rah</Text>
          <Text style={styles.ritualText}>{ritualPrompt}</Text>
          <View style={styles.ritualActions}>
            <Pressable onPress={() => router.push("/ask")}>
              <Text style={styles.ritualAction}>Ask Rah</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/decision")}>
              <Text style={styles.ritualAction}>Open Decision Studio</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/insight")}>
              <Text style={styles.ritualAction}>Open today's insight</Text>
            </Pressable>
          </View>
        </GlassPanel>

        {currentInsight ? (
          <GlassPanel style={styles.currentInsightPanel}>
            <Text style={styles.ritualLabel}>Current Insight</Text>
            <Text style={styles.timingText}>{currentInsight.content}</Text>
          </GlassPanel>
        ) : null}

        <GlassPanel style={styles.timingPanel}>
          <Text style={styles.ritualLabel}>Today's Timing</Text>
          <Text style={styles.timingText}>{timingInsight?.content || timingSummary}</Text>
          <View style={styles.badgeGrid}>
            <SignalBadge
              label="Signal"
              value={primarySignal?.signalType || "Still forming"}
            />
            <SignalBadge
              label="Intent"
              value={currentContext?.activeIntent ? currentContext.activeIntent.replace(/_/g, " ") : "Still mapping"}
            />
            <SignalBadge
              label="Decision Pulse"
              value={decisionPulseLabel}
            />
          </View>
        </GlassPanel>

        <GlassPanel style={styles.snapshotPanel}>
          <Text style={styles.sectionTitle}>Active Theme</Text>
          <View style={styles.badgeGrid}>
            <SignalBadge
              label="Life Area"
              value={currentContext?.mainLifeArea || "Still mapping"}
            />
            <SignalBadge
              label="Support Need"
              value={currentContext?.supportNeed || "Still mapping"}
            />
            <SignalBadge
              label="Sun"
              value={placementSummary?.sun ? placementSummary.sun.signLabel : "Unknown"}
            />
            <SignalBadge
              label="Moon"
              value={placementSummary?.moon ? placementSummary.moon.signLabel : "Unknown"}
            />
          </View>
        </GlassPanel>

        {chartReady && natalChart ? (
          <GlassPanel style={styles.chartPresencePanel}>
            <Text style={styles.decisionEyebrow}>Chart Presence</Text>
            <Text style={styles.sectionTitle}>Your sky is now part of every read</Text>
            <Text style={styles.memoryCallbackText}>{getChartConfidenceText(natalChart)}</Text>
            <Pressable onPress={() => router.push("/chart")}>
              <Text style={styles.memoryCallbackAction}>Open your full chart</Text>
            </Pressable>
          </GlassPanel>
        ) : null}

        <GlassPanel style={styles.noticePanel}>
          <Text style={styles.decisionEyebrow}>What Rah Wants You To Notice</Text>
          <Text style={styles.sectionTitle}>The pattern underneath the day</Text>
          <Text style={styles.memoryCallbackText}>{whatToNotice}</Text>
        </GlassPanel>

        {recentMemory ? (
          <GlassPanel style={styles.memoryCallbackPanel}>
            <Text style={styles.sectionTitle}>Rah Remembers</Text>
            <Text style={styles.memoryCallbackTitle}>{recentMemory.title}</Text>
            <Text style={styles.memoryCallbackText}>{recentMemory.description}</Text>
            <Pressable onPress={() => router.push("/journey")}>
              <Text style={styles.memoryCallbackAction}>Open your journey</Text>
            </Pressable>
          </GlassPanel>
        ) : null}

        <GlassPanel style={styles.decisionPanel}>
          <Text style={styles.decisionEyebrow}>Decision Studio</Text>
          <Text style={styles.sectionTitle}>Decision In Motion</Text>
          <Text style={styles.memoryCallbackText}>
            {latestDecision
              ? `Your decision field is still holding ${latestDecision.title.toLowerCase()} and its timing pressure.`
              : "Bring a real decision and your chart, memory, and life pressure will be weighed together."}
          </Text>
          {latestDecision ? (
            <View style={styles.badgeGrid}>
              <SignalBadge label="Pulse" value={decisionPulseLabel} />
              <SignalBadge label="Urgency" value={latestDecision.urgency.replace(/_/g, " ")} />
            </View>
          ) : null}
          <Pressable onPress={() => router.push("/decision")}>
            <Text style={styles.memoryCallbackAction}>
              {latestDecision ? "Continue decision analysis" : "Start with a decision"}
            </Text>
          </Pressable>
        </GlassPanel>

        {decisionNeedingOutcome ? (
          <GlassPanel style={styles.threadPanel}>
            <Text style={styles.decisionEyebrow}>Needs Check-In</Text>
            <Text style={styles.sectionTitle}>Outcome still needs a check-in</Text>
            <Text style={styles.memoryCallbackText}>
              You analyzed {decisionNeedingOutcome.title.toLowerCase()}, but the outcome has not been logged yet. This is where the path model starts learning from real life instead of only uncertainty.
            </Text>
            <Pressable onPress={() => router.push("/decision")}>
              <Text style={styles.memoryCallbackAction}>Log the outcome</Text>
            </Pressable>
          </GlassPanel>
        ) : null}

        {recentThread ? (
          <GlassPanel style={styles.threadPanel}>
            <Text style={styles.decisionEyebrow}>Return To Thread</Text>
            <Text style={styles.sectionTitle}>Continue the last conversation</Text>
            <Text style={styles.memoryCallbackTitle}>{recentThread.title}</Text>
            <Text style={styles.memoryCallbackText}>{recentThread.description}</Text>
            <Pressable onPress={() => router.push("/ask")}>
              <Text style={styles.memoryCallbackAction}>Open Ask Rah</Text>
            </Pressable>
          </GlassPanel>
        ) : null}

        {chartReady && natalChart ? (
          <ChartRevealCard
            chart={natalChart}
            title="Your sky map is live"
            subtitle="Your birth chart now powers reflection, daily timing, and decision reads with personal context."
          />
        ) : (
          <Pressable onPress={() => router.push("/profile-setup")}>
            <GlassPanel style={styles.chartPrompt}>
              <Text style={styles.chartPromptTitle}>Make astrology real</Text>
              <Text style={styles.chartPromptText}>
                Add birth details in Sky Setup to activate a real natal profile instead of generic signals.
              </Text>
            </GlassPanel>
          </Pressable>
        )}

        <View style={styles.list}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              subtitle={feature.subtitle}
              onPress={() => router.push(feature.path)}
            />
          ))}
        </View>
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  contextPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  contextTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  contextText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  contextAction: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  chartPrompt: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ritualPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timingPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  currentInsightPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timingText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  ritualLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ritualText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  ritualActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  ritualAction: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  snapshotPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  noticePanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chartPresencePanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  memoryCallbackPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  decisionPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  threadPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  decisionEyebrow: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  memoryCallbackTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  memoryCallbackText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  memoryCallbackAction: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  chartPromptTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  chartPromptText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  list: {
    marginTop: theme.spacing.sm,
  },
});

