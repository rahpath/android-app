import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { GlassPanel } from "@/components/glass/GlassPanel";
import { SignalBadge } from "@/components/home/SignalBadge";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology, useCurrentContext, useDecision, useInsights } from "@/context";
import { useRahEngine } from "@/intelligence/rahEngine";
import { theme } from "@/theme/theme";
import type { Insight } from "@/types/domain";

const getLocalDateKey = (value = new Date()) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DailyInsightScreen() {
  const { getLatestInsight } = useInsights();
  const { currentContext } = useCurrentContext();
  const { getLatestDecision } = useDecision();
  const { natalChart, getPrimarySignal } = useAstrology();
  const { generateDailyInsight } = useRahEngine();
  const [insight, setInsight] = useState<Insight | null>(getLatestInsight("daily_insight"));
  const [isLoading, setIsLoading] = useState(!insight);
  const primarySignal = getPrimarySignal();
  const latestDecision = getLatestDecision();
  const decisionPulseLabel =
    latestDecision?.decisionPulse === "move"
      ? "Move gently"
      : latestDecision?.decisionPulse === "wait"
        ? "Wait and watch"
        : latestDecision
          ? "Clarify first"
          : "No active decision";

  useEffect(() => {
    const existingInsight = getLatestInsight("daily_insight");
    if (
      existingInsight
      && getLocalDateKey(new Date(existingInsight.createdAt)) === getLocalDateKey()
    ) {
      setInsight(existingInsight);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    generateDailyInsight()
      .then((nextInsight) => {
        if (isMounted) {
          setInsight(nextInsight);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [generateDailyInsight, getLatestInsight]);

  return (
    <RahAppShell activePath="/home">
      <AtmosphericScrollView contentContainerStyle={styles.contentWrap} showsVerticalScrollIndicator={false}>
        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>Daily Insight</Text>
          <Text style={styles.subLabel}>
            This read combines your chart, present-day context, and stored memory to time the day with precision.
          </Text>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={theme.colors.text} />
              <Text style={styles.content}>Reading your signals for today...</Text>
            </View>
          ) : (
            <Text style={styles.content}>
              {insight?.content || "Today's reflection layer is still shaping."}
            </Text>
          )}
          <Text style={styles.source}>
            Source: {insight?.source === "gemini" ? "Rah Intelligence" : "System Fallback"}
          </Text>
        </GlassPanel>

        <GlassPanel style={styles.snapshotPanel}>
          <Text style={styles.snapshotTitle}>Why this is showing up</Text>
          <View style={styles.badgeGrid}>
            <SignalBadge
              label="Signal"
              value={primarySignal?.signalType || "Still forming"}
            />
            <SignalBadge
              label="Main Area"
              value={currentContext?.mainLifeArea || "Still mapping"}
            />
            <SignalBadge
              label="Sun"
              value={natalChart?.corePlacements.sun?.signLabel || "Unknown"}
            />
            <SignalBadge
              label="Moon"
              value={natalChart?.corePlacements.moon?.signLabel || "Unknown"}
            />
            <SignalBadge
              label="Decision"
              value={decisionPulseLabel}
            />
          </View>
        </GlassPanel>
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  panel: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  subLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  loadingState: {
    gap: theme.spacing.sm,
    alignItems: "flex-start",
  },
  content: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 26,
  },
  source: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
  },
  snapshotPanel: {
    gap: theme.spacing.sm,
  },
  snapshotTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
