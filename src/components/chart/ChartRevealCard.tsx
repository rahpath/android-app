import { StyleSheet, Text, View } from "react-native";

import { NatalChartWheel } from "@/components/chart/NatalChartWheel";
import { PlacementPill } from "@/components/chart/PlacementPill";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { theme } from "@/theme/theme";
import type { NatalChart } from "@/types/domain";

type ChartRevealCardProps = {
  chart: NatalChart;
  title?: string;
  subtitle?: string;
};

export function ChartRevealCard({
  chart,
  title = "Your Sky Map",
  subtitle,
}: ChartRevealCardProps) {
  return (
    <GlassPanel style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {subtitle
            ?? (chart.accuracy === "full_time"
              ? "Your chart now reads through both sign and house structure."
              : "Your sign-based chart is active. Add birth time later to unlock rising sign and houses with confidence.")}
        </Text>
      </View>

      <View style={styles.wheelWrap}>
        <NatalChartWheel chart={chart} />
      </View>

      <View style={styles.pillGrid}>
        {chart.corePlacements.sun ? (
          <PlacementPill
            label="Sun"
            value={`${chart.corePlacements.sun.signLabel} ${chart.corePlacements.sun.degreeWithinSign}`}
            accent="rgba(255,196,106,0.16)"
          />
        ) : null}
        {chart.corePlacements.moon ? (
          <PlacementPill
            label="Moon"
            value={`${chart.corePlacements.moon.signLabel} ${chart.corePlacements.moon.degreeWithinSign}`}
            accent="rgba(122,216,255,0.15)"
          />
        ) : null}
        <PlacementPill
          label="Rising"
          value={chart.corePlacements.rising?.signLabel ?? "Needs birth time"}
          accent="rgba(163,139,255,0.18)"
        />
        <PlacementPill
          label="Place"
          value={chart.location.label.split(",")[0]}
          accent="rgba(255,255,255,0.08)"
        />
      </View>

      <Text style={styles.summary}>{chart.summary}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
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
  wheelWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  summary: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    lineHeight: 20,
  },
});
