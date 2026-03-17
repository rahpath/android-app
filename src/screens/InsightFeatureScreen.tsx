import { StyleSheet, Text, View } from "react-native";

import { getFeatureAstrologyLens } from "@/astrology/chartNarratives";
import { AstrologyMeaningCard } from "@/components/chart/AstrologyMeaningCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology, useInsights } from "@/context";
import { theme } from "@/theme/theme";

export function InsightFeatureScreen({
  title,
  insightType,
  description,
  feature,
}: {
  title: string;
  insightType: string;
  description: string;
  feature: "relationships" | "career" | "patterns";
}) {
  const { getLatestInsight } = useInsights();
  const { natalChart } = useAstrology();
  const insight = getLatestInsight(insightType);
  const lens = getFeatureAstrologyLens(natalChart, feature);

  return (
    <RahAppShell activePath="/home">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </GlassPanel>

        <GlassPanel style={styles.resultPanel}>
          <Text style={styles.resultTitle}>Latest read</Text>
          <Text style={styles.resultText}>
            {insight?.content || "This lens is still shaping from your chart, context, and stored memory."}
          </Text>
          <Text style={styles.source}>
            Source: {insight?.source === "gemini" ? "Rah Intelligence" : "Cached system layer"}
          </Text>
        </GlassPanel>

        <AstrologyMeaningCard
          eyebrow="Chart Lens"
          title={lens.title}
          content={lens.content}
        />
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
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  resultPanel: {
    gap: theme.spacing.sm,
  },
  resultTitle: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 26,
  },
  source: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
  },
});
