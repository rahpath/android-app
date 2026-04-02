import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useCurrentContext, useInsights, useMemory } from "@/context";
import { theme } from "@/theme/theme";

function trimCopy(value: string, maxLength = 90) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function getDateKey(offset: number) {
  const value = new Date();
  value.setDate(value.getDate() - offset);
  return value.toISOString().slice(0, 10);
}

function getEnergyValue(tags: string[]) {
  const energyTag = tags.find((tag) => tag.startsWith("energy:"));
  const parsed = energyTag ? Number(energyTag.split(":")[1]) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplayLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PatternsScreen() {
  const { memoryEvents } = useMemory();
  const { currentContext } = useCurrentContext();
  const { getLatestInsight } = useInsights();

  const reflectEvents = useMemo(
    () => memoryEvents.filter((event) => event.tags.includes("reflect-flow")),
    [memoryEvents],
  );

  const weeklyBars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const dateKey = getDateKey(6 - index);
        const dayEvents = reflectEvents.filter((event) => event.date.slice(0, 10) === dateKey);
        const energyValues = dayEvents
          .map((event) => getEnergyValue(event.tags))
          .filter((value): value is number => value !== null);
        const average = energyValues.length > 0
          ? Math.round((energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) * 20)
          : dayEvents.length > 0
            ? Math.min(dayEvents.length * 22, 88)
            : 16;

        return {
          key: dateKey,
          label: new Date(dateKey).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
          value: average,
        };
      }),
    [reflectEvents],
  );

  const latestPattern = getLatestInsight("pattern_insight")?.content;

  const patternCards = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    reflectEvents.forEach((event) => {
      event.tags
        .filter((tag) => !tag.startsWith("mood:") && !tag.startsWith("energy:") && tag !== "reflect-flow")
        .forEach((tag) => categoryCounts.set(tag, (categoryCounts.get(tag) || 0) + 1));
    });

    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const primaryCard = {
      title: currentContext?.repeatingPattern
        ? `${trimCopy(toDisplayLabel(currentContext.repeatingPattern), 24)} Pattern`
        : "Overthinking Pattern",
      description: trimCopy(
        latestPattern || "You tend to overthink when decisions are unclear.",
        88,
      ),
      frequency: `Seen ${Math.max(reflectEvents.length, 1)} time${reflectEvents.length === 1 ? "" : "s"} this week`,
      trigger: currentContext?.supportNeed
        ? `Triggered by ${currentContext.supportNeed.toLowerCase()} and lack of clarity`
        : "Triggered by uncertainty and lack of clarity",
      tags: topCategories.length > 0
        ? topCategories.map(([tag]) => toDisplayLabel(tag))
        : ["Emotional", "Decision", "Social"],
      progress: "You handled stress better this week.",
    };

    const secondaryCard = {
      title: currentContext?.mainLifeArea ? `${toDisplayLabel(currentContext.mainLifeArea)} Loop` : "Emotional Loop",
      description: trimCopy(
        currentContext?.currentFocusSummary || "Your state shifts faster when pressure and ambiguity arrive together.",
        88,
      ),
      frequency: `Seen ${Math.max(topCategories[0]?.[1] || 2, 2)} times this week`,
      trigger: currentContext?.followUpSummary
        ? trimCopy(currentContext.followUpSummary, 70)
        : "Triggered by pressure, uncertainty, and delayed answers",
      tags: primaryCard.tags,
      progress: "Your awareness is getting quicker than the pattern.",
    };

    return [primaryCard, secondaryCard];
  }, [currentContext, latestPattern, reflectEvents]);

  return (
    <RahAppShell activePath="/decision">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>Patterns</Text>
          <Text style={styles.title}>Weekly mood and energy trend</Text>
          <View style={styles.graphRow}>
            {weeklyBars.map((bar) => (
              <View key={bar.key} style={styles.graphItem}>
                <View style={styles.graphTrack}>
                  <View style={[styles.graphBar, { height: `${Math.max(bar.value, 12)}%` }]} />
                </View>
                <Text style={styles.graphLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </GlassPanel>

        {patternCards.map((card) => (
          <GlassPanel key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
            <Text style={styles.metaLine}>{card.frequency}</Text>
            <Text style={styles.metaLine}>{card.trigger}</Text>
            <View style={styles.tagRow}>
              {card.tags.map((tag) => (
                <View key={`${card.title}-${tag}`} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.progressLine}>{card.progress}</Text>
          </GlassPanel>
        ))}
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  hero: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  graphRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    minHeight: 180,
  },
  graphItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  graphTrack: {
    width: "100%",
    height: 150,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.46)",
    justifyContent: "flex-end",
    padding: 8,
  },
  graphBar: {
    width: "100%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  graphLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  card: {
    gap: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "800",
  },
  cardDescription: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  metaLine: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  tag: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },
  tagText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  progressLine: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
});
