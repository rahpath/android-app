import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ChartRevealCard } from "@/components/chart/ChartRevealCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useAstrology, useUser } from "@/context";
import { theme } from "@/theme/theme";

export function ChartRevealScreen() {
  const { natalChart, chartReady, isLoading, error } = useAstrology();
  const { updateUser } = useUser();

  const handleContinue = async () => {
    await updateUser({
      chartRevealed: true,
    });
    router.push("/intent-setup");
  };

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Sky" currentStep={2} totalSteps={4} />
        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>Chart Reveal</Text>
          <Text style={styles.title}>Your sky map is now active</Text>
          <Text style={styles.subtitle}>
            This is your first layer of deep context. From here on, chart timing blends with memory and present-life pressure.
          </Text>
        </GlassPanel>

        {isLoading ? (
          <GlassPanel style={styles.statePanel}>
            <ActivityIndicator color={theme.colors.text} />
            <Text style={styles.stateText}>Mapping your chart...</Text>
          </GlassPanel>
        ) : null}

        {!isLoading && chartReady && natalChart ? (
          <ChartRevealCard chart={natalChart} />
        ) : null}

        {!isLoading && error ? (
          <GlassPanel style={styles.statePanel}>
            <Text style={styles.stateTitle}>Chart needs another pass</Text>
            <Text style={styles.stateText}>{error}</Text>
            <GlassButton label="Back To Sky Setup" onPress={() => router.back()} />
          </GlassPanel>
        ) : null}

        {chartReady && natalChart ? (
          <GlassButton label="Continue" onPress={handleContinue} />
        ) : null}
      </AtmosphericScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.secondary,
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
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  statePanel: {
    gap: theme.spacing.sm,
  },
  stateTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  stateText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
});
