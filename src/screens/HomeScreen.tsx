import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getChartConfidenceText } from "@/astrology/chartNarratives";
import { ChartRevealCard } from "@/components/chart/ChartRevealCard";
import { FeatureCard } from "@/components/cards/FeatureCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { SignalBadge } from "@/components/home/SignalBadge";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology, useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import { theme } from "@/theme/theme";

function trimInsight(value: string, maxLength = 100) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

const DAILY_DRAW_STORAGE_KEY = "rah:dailyIntuitiveDraw";

const DRAW_OPTIONS = [
  { id: "moon", label: "Moon Card" },
  { id: "mirror", label: "Mirror Card" },
  { id: "path", label: "Path Card" },
] as const;

function formatHomeDate(value = new Date()) {
  return value.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? "Good morning" : hour < 18 ? "Good evening" : "Good night";
  return `${prefix}, ${name || "there"}`;
}

function buildPeriodInsight({
  period,
  daily,
  current,
  relationship,
  career,
  timing,
  fallback,
}: {
  period: "daily" | "weekly" | "monthly";
  daily?: string;
  current?: string;
  relationship?: string;
  career?: string;
  timing?: string;
  fallback: string;
}) {
  if (period === "daily") {
    return trimInsight(daily || current || fallback, 120);
  }

  if (period === "weekly") {
    return trimInsight(career || relationship || current || fallback, 120);
  }

  return trimInsight(timing || current || relationship || fallback, 120);
}

function buildEnergyMetrics(mainLifeArea?: string, supportNeed?: string, hasDecision?: boolean) {
  const emotional = supportNeed === "Calm" ? 82 : supportNeed === "Validation" ? 72 : 68;
  const focus = mainLifeArea === "Career" ? 84 : hasDecision ? 77 : 63;
  const social = mainLifeArea === "Relationships" ? 80 : supportNeed === "Direction" ? 58 : 52;
  const clarity = hasDecision ? 61 : supportNeed === "Clarity" ? 79 : 66;

  return [
    { label: "Emotional energy", value: emotional },
    { label: "Focus level", value: focus },
    { label: "Social energy", value: social },
    { label: "Decision clarity", value: clarity },
  ];
}

function buildTimelineItems(mainLifeArea?: string, supportNeed?: string) {
  return [
    {
      slot: "Morning",
      action: mainLifeArea === "Career" ? "Planning window" : "Set your pace",
      detail: "Use the early hours for calm structure.",
    },
    {
      slot: "Afternoon",
      action: supportNeed === "Calm" ? "Protect your energy" : "Meaningful conversations",
      detail: "Avoid rushed reactions and notice tone shifts.",
    },
    {
      slot: "Evening",
      action: supportNeed === "Direction" ? "Review the day" : "Reflect gently",
      detail: "Let insight land before making big calls.",
    },
  ];
}

function buildDrawInsight(drawId: string, pattern?: string, supportNeed?: string) {
  const patternText = pattern ? pattern.toLowerCase() : "your current pattern";

  if (drawId === "moon") {
    return `Your emotional field is revealing ${patternText}. Move slowly with what surfaces.`;
  }

  if (drawId === "mirror") {
    return `Today's mirror is ${supportNeed?.toLowerCase() || "clarity"}. What you notice twice deserves attention.`;
  }

  return `A path opens when you stop forcing ${patternText}. Let the next step be smaller than the fear.`;
}

export function HomeScreen() {
  const { user } = useUser();
  const { getLatestInsight } = useInsights();
  const { getPrimarySignal, chartReady, natalChart } = useAstrology();
  const { currentContext } = useCurrentContext();
  const { memoryEvents } = useMemory();
  const { getLatestDecision, getDecisionNeedingOutcome } = useDecision();
  const [selectedInsightRange, setSelectedInsightRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [drawModalVisible, setDrawModalVisible] = useState(false);
  const [usedDrawToday, setUsedDrawToday] = useState(false);
  const [drawResult, setDrawResult] = useState<{ date: string; cardId: string; insight: string } | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(DAILY_DRAW_STORAGE_KEY)
      .then((raw) => {
        if (!raw || !isMounted) {
          return;
        }

        const parsed = JSON.parse(raw) as { date: string; cardId: string; insight: string };
        const today = new Date().toISOString().slice(0, 10);
        if (parsed.date === today) {
          setDrawResult(parsed);
          setUsedDrawToday(true);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const latestInsight = getLatestInsight("daily_insight");
  const currentInsight = getLatestInsight("current_insight");
  const timingInsight = getLatestInsight("timing_insight");
  const relationshipInsight = getLatestInsight("relationship_insight");
  const careerInsight = getLatestInsight("career_insight");
  const primarySignal = getPrimarySignal();
  const dailyMessage = trimInsight(
    latestInsight?.content
      ?? (primarySignal
        ? `Your ${primarySignal.signalType} is rising today.`
        : "Your path profile is still calibrating."),
    84,
  );
  const contextSummary = trimInsight(
    currentContext?.setupCompleted
      ? `${currentContext.mainLifeArea || "Life"} feels most charged, and your path engine is tuned for ${currentContext.supportNeed || "clarity"}.`
      : "Finish setup so your present emotional and decision context can power every read.",
    100,
  );
  const ritualPrompt = trimInsight(
    currentContext?.setupCompleted
      ? `Your path lens is holding ${currentContext.repeatingPattern || "your current pattern"} while today's signal leans toward ${primarySignal?.signalType || "reflection"}.`
      : "Complete setup to activate chart-timed daily rhythm across the app.",
    100,
  );
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
  const timingSummary = trimInsight(
    primarySignal
      ? `${primarySignal.planet} is amplifying ${primarySignal.signalType.toLowerCase()} right now.`
      : "Today's timing layer is still syncing with your chart and context.",
    96,
  );
  const whatToNotice = trimInsight(
    latestDecision?.nextMove
      || currentContext?.followUpSummary
      || currentContext?.currentFocusSummary
      || "Keep noticing where your body softens versus tightens around the same choice.",
    100,
  );
  const periodInsight = buildPeriodInsight({
    period: selectedInsightRange,
    daily: latestInsight?.content,
    current: currentInsight?.content,
    relationship: relationshipInsight?.content,
    career: careerInsight?.content,
    timing: timingInsight?.content,
    fallback: dailyMessage,
  });
  const energyMetrics = useMemo(
    () => buildEnergyMetrics(
      currentContext?.mainLifeArea,
      currentContext?.supportNeed,
      Boolean(latestDecision),
    ),
    [currentContext?.mainLifeArea, currentContext?.supportNeed, latestDecision],
  );
  const timelineItems = useMemo(
    () => buildTimelineItems(currentContext?.mainLifeArea, currentContext?.supportNeed),
    [currentContext?.mainLifeArea, currentContext?.supportNeed],
  );

  const handleDrawSelection = async (cardId: string) => {
    if (usedDrawToday) {
      return;
    }

    const nextResult = {
      date: new Date().toISOString().slice(0, 10),
      cardId,
      insight: buildDrawInsight(
        cardId,
        currentContext?.repeatingPattern,
        currentContext?.supportNeed,
      ),
    };

    setDrawResult(nextResult);
    setUsedDrawToday(true);
    await AsyncStorage.setItem(DAILY_DRAW_STORAGE_KEY, JSON.stringify(nextResult));
  };

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
        <GlassPanel style={styles.userContextHeader}>
          <View style={styles.userContextRow}>
            <View style={styles.userContextProfile}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{(user?.name?.[0] || "R").toUpperCase()}</Text>
              </View>
              <View style={styles.userContextCopy}>
                <Text style={styles.userContextGreeting}>{getGreeting(user?.name ?? "Aryan")}</Text>
                <Text style={styles.userContextDate}>{formatHomeDate()}</Text>
              </View>
            </View>
            <Pressable style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>◦</Text>
            </Pressable>
          </View>
        </GlassPanel>

        <GlassPanel style={styles.dailyInsightCard}>
          <View style={styles.dailyInsightHeader}>
            <Text style={styles.dailyInsightLabel}>Daily Insight</Text>
            <View style={styles.rangeTabs}>
              {(["daily", "weekly", "monthly"] as const).map((range) => {
                const active = selectedInsightRange === range;
                return (
                  <Pressable
                    key={range}
                    onPress={() => setSelectedInsightRange(range)}
                    style={[styles.rangeTab, active && styles.rangeTabActive]}
                  >
                    <Text style={[styles.rangeTabText, active && styles.rangeTabTextActive]}>
                      {range[0].toUpperCase() + range.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Text style={styles.dailyInsightText}>{periodInsight}</Text>
          <Text style={styles.dailyInsightMeta}>
            Self, love, career, and relationship timing are blended into your read.
          </Text>
        </GlassPanel>

        <GlassPanel style={styles.energyOverviewCard}>
          <Text style={styles.topSectionTitle}>Energy Overview</Text>
          <View style={styles.energyMetricList}>
            {energyMetrics.map((metric) => (
              <View key={metric.label} style={styles.energyMetricItem}>
                <View style={styles.energyMetricHeader}>
                  <Text style={styles.energyMetricLabel}>{metric.label}</Text>
                  <Text style={styles.energyMetricValue}>{metric.value}%</Text>
                </View>
                <View style={styles.energyTrack}>
                  <View style={[styles.energyFill, { width: `${metric.value}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </GlassPanel>

        <Pressable onPress={() => setDrawModalVisible(true)}>
          <GlassPanel style={styles.drawBanner}>
            <View style={styles.drawBannerArt}>
              <View style={styles.waveCluster}>
                <View style={styles.waveLarge} />
                <View style={styles.waveMid} />
                <View style={styles.waveSmall} />
              </View>
              <View style={styles.compassWrap}>
                <View style={styles.compassOuter}>
                  <View style={styles.compassInner} />
                  <Text style={styles.compassStar}>✦</Text>
                </View>
                <View style={styles.cardFan}>
                  <View style={[styles.cardLeaf, styles.cardLeafBack]} />
                  <View style={[styles.cardLeaf, styles.cardLeafFront]} />
                </View>
              </View>
            </View>
            <View style={styles.drawBannerContent}>
              <View style={styles.drawBannerCopy}>
                <Text style={styles.drawBannerTitle}>Check your{"\n"}energy today</Text>
                <Text style={styles.drawBannerText}>
                  {usedDrawToday && drawResult
                    ? `Today's card: ${DRAW_OPTIONS.find((option) => option.id === drawResult.cardId)?.label || "Chosen"}`
                    : "Tarot / intuitive draw"}
                </Text>
              </View>
              <View style={styles.drawRevealPill}>
                <Text style={styles.drawRevealText}>{usedDrawToday ? "Opened" : "Reveal"}</Text>
              </View>
            </View>
          </GlassPanel>
        </Pressable>

        <GlassPanel style={styles.timelineCard}>
          <Text style={styles.topSectionTitle}>Today Timeline</Text>
          <View style={styles.timelineList}>
            {timelineItems.map((item) => (
              <View key={item.slot} style={styles.timelineItem}>
                <Text style={styles.timelineSlot}>{item.slot}</Text>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineAction}>{item.action}</Text>
                  <Text style={styles.timelineDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassPanel>

        <Pressable onPress={() => router.push("/journey")}>
          <GlassPanel style={styles.reflectReminderCard}>
            <Text style={styles.reflectReminderLabel}>Reflect Reminder</Text>
            <Text style={styles.reflectReminderText}>How are you feeling right now?</Text>
          </GlassPanel>
        </Pressable>

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
            <Text style={styles.timingText}>{trimInsight(currentInsight.content, 100)}</Text>
          </GlassPanel>
        ) : null}

        <GlassPanel style={styles.timingPanel}>
          <Text style={styles.ritualLabel}>Today's Timing</Text>
          <Text style={styles.timingText}>{trimInsight(timingInsight?.content || timingSummary, 100)}</Text>
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
            <Text style={styles.memoryCallbackText}>{trimInsight(getChartConfidenceText(natalChart), 100)}</Text>
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
            <Text style={styles.memoryCallbackText}>{trimInsight(recentMemory.description, 100)}</Text>
            <Pressable onPress={() => router.push("/journey")}>
              <Text style={styles.memoryCallbackAction}>Open your journey</Text>
            </Pressable>
          </GlassPanel>
        ) : null}

        <GlassPanel style={styles.decisionPanel}>
          <Text style={styles.decisionEyebrow}>Decision Studio</Text>
          <Text style={styles.sectionTitle}>Decision In Motion</Text>
          <Text style={styles.memoryCallbackText}>
            {trimInsight(
              latestDecision
                ? `Your decision field is still holding ${latestDecision.title.toLowerCase()} and its timing pressure.`
                : "Bring a real decision and your chart, memory, and life pressure will be weighed together.",
              100,
            )}
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
              {trimInsight(
                `You analyzed ${decisionNeedingOutcome.title.toLowerCase()}, but the outcome has not been logged yet. This is where the path model starts learning from real life instead of only uncertainty.`,
                100,
              )}
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
            <Text style={styles.memoryCallbackText}>{trimInsight(recentThread.description, 100)}</Text>
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

        <Modal
          visible={drawModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassPanel style={styles.drawModalCard}>
              <Text style={styles.drawModalTitle}>Intuitive Draw</Text>
              <Text style={styles.drawModalSubtitle}>
                {usedDrawToday
                  ? "You've used your free reading for today."
                  : "Choose one card and let your instinct lead."}
              </Text>
              <View style={styles.drawCardRow}>
                {DRAW_OPTIONS.map((option) => {
                  const isChosen = drawResult?.cardId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => void handleDrawSelection(option.id)}
                      style={[styles.drawCardOption, isChosen && styles.drawCardOptionActive]}
                    >
                      <Text style={styles.drawCardLabel}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {drawResult ? (
                <Text style={styles.drawResultText}>{drawResult.insight}</Text>
              ) : (
                <Text style={styles.drawResultText}>One free reading unlocks each day.</Text>
              )}
              <Pressable onPress={() => setDrawModalVisible(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </GlassPanel>
          </View>
        </Modal>
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  userContextHeader: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  userContextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  userContextProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
  },
  avatarLetter: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "800",
  },
  userContextCopy: {
    gap: 4,
    flex: 1,
  },
  userContextGreeting: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  userContextDate: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    fontWeight: "600",
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  notificationIcon: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  dailyInsightCard: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  dailyInsightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dailyInsightLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  rangeTabs: {
    flexDirection: "row",
    gap: 8,
  },
  rangeTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  rangeTabActive: {
    backgroundColor: "rgba(18,55,101,0.14)",
  },
  rangeTabText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  rangeTabTextActive: {
    color: theme.colors.text,
  },
  dailyInsightText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  dailyInsightMeta: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  energyOverviewCard: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  topSectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  energyMetricList: {
    gap: 14,
  },
  energyMetricItem: {
    gap: 8,
  },
  energyMetricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  energyMetricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  energyMetricValue: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  energyTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.52)",
  },
  energyFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
  },
  drawBanner: {
    overflow: "hidden",
    minHeight: 148,
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    paddingBottom: 16,
  },
  drawBannerArt: {
    ...StyleSheet.absoluteFillObject,
  },
  drawBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    minHeight: 112,
  },
  drawBannerCopy: {
    flex: 1,
    gap: 6,
    paddingTop: 6,
  },
  drawBannerTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  drawBannerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  drawRevealPill: {
    alignSelf: "center",
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(246, 234, 210, 0.94)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 173, 132, 0.44)",
  },
  drawRevealText: {
    color: "#3a4f67",
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  waveCluster: {
    position: "absolute",
    left: -12,
    right: 84,
    bottom: -18,
    height: 78,
  },
  waveLarge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 54,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 90,
    backgroundColor: "rgba(39, 82, 119, 0.92)",
  },
  waveMid: {
    position: "absolute",
    left: 34,
    width: 132,
    bottom: 24,
    height: 32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 50,
    backgroundColor: "rgba(84, 127, 162, 0.82)",
    transform: [{ rotate: "-4deg" }],
  },
  waveSmall: {
    position: "absolute",
    left: 136,
    width: 94,
    bottom: 18,
    height: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 36,
    backgroundColor: "rgba(117, 158, 188, 0.76)",
    transform: [{ rotate: "7deg" }],
  },
  compassWrap: {
    position: "absolute",
    right: 14,
    top: 8,
    width: 126,
    height: 92,
  },
  compassOuter: {
    position: "absolute",
    right: 18,
    top: 4,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 230, 207, 0.96)",
    borderWidth: 2,
    borderColor: "rgba(67, 92, 119, 0.55)",
  },
  compassInner: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(67, 92, 119, 0.45)",
  },
  compassStar: {
    color: "#385470",
    fontSize: 21,
    fontWeight: "700",
  },
  cardFan: {
    position: "absolute",
    right: 0,
    top: 14,
    width: 58,
    height: 48,
  },
  cardLeaf: {
    position: "absolute",
    width: 34,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(67, 92, 119, 0.35)",
    backgroundColor: "rgba(243, 235, 216, 0.98)",
  },
  cardLeafBack: {
    right: 4,
    top: 2,
    transform: [{ rotate: "18deg" }],
  },
  cardLeafFront: {
    right: 18,
    top: 6,
    transform: [{ rotate: "-8deg" }],
  },
  timelineCard: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  timelineList: {
    gap: theme.spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  timelineSlot: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    minWidth: 68,
    paddingTop: 2,
  },
  timelineCopy: {
    flex: 1,
    gap: 4,
  },
  timelineAction: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  timelineDetail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  reflectReminderCard: {
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  reflectReminderLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reflectReminderText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  header: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  contextPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  ritualPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  timingPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  currentInsightPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  noticePanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  chartPresencePanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  decisionPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  threadPanel: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    marginTop: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: "rgba(33,50,74,0.24)",
  },
  drawModalCard: {
    gap: theme.spacing.md,
  },
  drawModalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    textAlign: "center",
  },
  drawModalSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  drawCardRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  drawCardOption: {
    flex: 1,
    minHeight: 112,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 10,
  },
  drawCardOptionActive: {
    backgroundColor: "rgba(18,55,101,0.14)",
    borderColor: "rgba(79,104,129,0.54)",
  },
  drawCardLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  drawResultText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  modalCloseText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
