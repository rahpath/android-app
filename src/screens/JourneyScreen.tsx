import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChartRevealCard } from "@/components/chart/ChartRevealCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology, useMemory } from "@/context";
import { theme } from "@/theme/theme";

export function JourneyScreen() {
  const { memoryEvents, removeMemoryEvent } = useMemory();
  const { natalChart, chartReady, isLoading: isChartLoading, error: chartError } = useAstrology();

  return (
    <RahAppShell activePath="/journey">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPanel style={styles.heroPanel}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>
            This is where the longer arc of your life story, decisions, and recurring patterns is held over time.
          </Text>
          <View style={styles.heroActions}>
            <GlassButton
              label="Ask Rah About Your Journey"
              onPress={() => router.push("/ask")}
            />
            <GlassButton
              label="Open Full Chart"
              onPress={() => router.push("/chart")}
            />
          </View>
          <Text style={styles.helperText}>
            Memory capture is now happening through setup, chat, and later timeline logging rather than one overloaded intake flow.
          </Text>
        </GlassPanel>

        {!chartReady && !isChartLoading ? (
          <GlassPanel style={styles.statusPanel}>
            <Text style={styles.statusTitle}>Your chart lives in Sky Setup</Text>
            <Text style={styles.statusText}>
              Birth details are stored directly as profile data. Journey is only for lived context and memory-building.
            </Text>
            <GlassButton
              label="Open Sky Setup"
              onPress={() => router.push("/profile-setup")}
            />
          </GlassPanel>
        ) : null}

        {chartReady && natalChart ? (
          <ChartRevealCard
            chart={natalChart}
            title="Your chart is now part of the path engine"
            subtitle="Birth data is no longer decorative. Your sky map now shapes memory, insights, and reflection."
          />
        ) : null}

        {!chartReady && isChartLoading ? (
          <GlassPanel style={styles.statusPanel}>
            <Text style={styles.statusTitle}>Mapping your chart...</Text>
            <Text style={styles.statusText}>
              Resolving your birth place and building a natal profile.
            </Text>
          </GlassPanel>
        ) : null}

        {!chartReady && chartError ? (
          <GlassPanel style={styles.statusPanel}>
            <Text style={styles.statusTitle}>Chart not ready yet</Text>
            <Text style={styles.statusText}>{chartError}</Text>
          </GlassPanel>
        ) : null}

        <View style={styles.memoryList}>
          {memoryEvents.length > 0 ? (
            memoryEvents.map((event) => (
              <GlassPanel key={event.id} style={styles.memoryCard}>
                <Text style={styles.memoryTitle}>{event.title}</Text>
                <Text style={styles.memoryMeta}>
                  {event.type} | {event.date}
                </Text>
                <Text style={styles.memoryDescription}>{event.description}</Text>
                <Text style={styles.memoryTags}>{event.tags.join(" | ")}</Text>
                <Pressable onPress={() => removeMemoryEvent(event.id)}>
                  <Text style={styles.removeAction}>Remove memory</Text>
                </Pressable>
              </GlassPanel>
            ))
          ) : (
            <GlassPanel style={styles.memoryCard}>
              <Text style={styles.memoryTitle}>No journey memories yet</Text>
              <Text style={styles.memoryDescription}>
                Start guided reflection to turn your answers into meaningful memory events.
              </Text>
            </GlassPanel>
          )}
        </View>
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  heroPanel: {
    gap: theme.spacing.md,
  },
  heroActions: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  helperText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
  },
  statusPanel: {
    gap: theme.spacing.xs,
  },
  statusTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  statusText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  memoryList: {
    gap: theme.spacing.sm,
  },
  memoryCard: {
    gap: theme.spacing.sm,
  },
  memoryTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  memoryMeta: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    textTransform: "capitalize",
  },
  memoryDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  memoryTags: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  removeAction: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
});
