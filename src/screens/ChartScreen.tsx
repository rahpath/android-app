import { StyleSheet, Text, View } from "react-native";

import {
  getChartConfidenceText,
  getChartMeaningCards,
  getTopAspectCards,
} from "@/astrology/chartNarratives";
import { AstrologyMeaningCard } from "@/components/chart/AstrologyMeaningCard";
import { NatalChartWheel } from "@/components/chart/NatalChartWheel";
import { PlacementPill } from "@/components/chart/PlacementPill";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useAstrology } from "@/context";
import { router } from "expo-router";
import { theme } from "@/theme/theme";

export function ChartScreen() {
  const { natalChart, chartReady, isLoading, error } = useAstrology();

  if (!chartReady || !natalChart) {
    return (
      <RahAppShell activePath="/chart">
        <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassPanel style={styles.hero}>
            <Text style={styles.eyebrow}>Your Chart</Text>
            <Text style={styles.title}>Your sky details are needed first</Text>
            <Text style={styles.body}>
              {isLoading
                ? "Your chart is still being mapped."
                : error || "Add birth details so your natal chart can power every feature."}
            </Text>
            <GlassButton label="Open Sky Setup" onPress={() => router.push("/profile-setup")} />
          </GlassPanel>
        </AtmosphericScrollView>
      </RahAppShell>
    );
  }

  const meaningCards = getChartMeaningCards(natalChart);
  const aspectCards = getTopAspectCards(natalChart);

  return (
    <RahAppShell activePath="/chart">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassPanel style={styles.hero}>
          <Text style={styles.eyebrow}>Your Chart</Text>
          <Text style={styles.title}>Reading of your sky map</Text>
          <Text style={styles.body}>{getChartConfidenceText(natalChart)}</Text>
        </GlassPanel>

        <GlassPanel style={styles.wheelPanel}>
          <View style={styles.wheelWrap}>
            <NatalChartWheel chart={natalChart} size={300} />
          </View>
          <Text style={styles.summary}>{natalChart.summary}</Text>
        </GlassPanel>

        <GlassPanel style={styles.placementPanel}>
          <Text style={styles.sectionTitle}>Core Placements</Text>
          <View style={styles.pillGrid}>
            {natalChart.corePlacements.sun ? (
              <PlacementPill
                label="Sun"
                value={`${natalChart.corePlacements.sun.signLabel} ${natalChart.corePlacements.sun.degreeWithinSign}`}
                accent="rgba(255,196,106,0.14)"
              />
            ) : null}
            {natalChart.corePlacements.moon ? (
              <PlacementPill
                label="Moon"
                value={`${natalChart.corePlacements.moon.signLabel} ${natalChart.corePlacements.moon.degreeWithinSign}`}
                accent="rgba(122,216,255,0.14)"
              />
            ) : null}
            <PlacementPill
              label="Rising"
              value={natalChart.corePlacements.rising?.signLabel ?? "Needs birth time"}
              accent="rgba(163,139,255,0.16)"
            />
            <PlacementPill
              label="Midheaven"
              value={natalChart.corePlacements.midheaven?.signLabel ?? "Needs birth time"}
              accent="rgba(255,255,255,0.08)"
            />
          </View>
        </GlassPanel>

        <View style={styles.sectionWrap}>
          {meaningCards.map((card) => (
            <AstrologyMeaningCard
              key={card.eyebrow}
              eyebrow={card.eyebrow}
              title={card.title}
              content={card.content}
            />
          ))}
        </View>

        <GlassPanel style={styles.aspectPanel}>
          <Text style={styles.sectionTitle}>Major Aspects In Focus</Text>
          <View style={styles.sectionWrap}>
            {aspectCards.map((card) => (
              <AstrologyMeaningCard
                key={card.title}
                eyebrow="Aspect"
                title={card.title}
                content={card.content}
              />
            ))}
          </View>
        </GlassPanel>
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
  eyebrow: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    lineHeight: 30,
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  wheelPanel: {
    gap: theme.spacing.md,
  },
  wheelWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    lineHeight: 20,
  },
  placementPanel: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  sectionWrap: {
    gap: theme.spacing.md,
  },
  aspectPanel: {
    gap: theme.spacing.md,
  },
});
