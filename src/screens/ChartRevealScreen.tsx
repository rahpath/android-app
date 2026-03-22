import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useAstrology, useUser } from "@/context";
import { theme } from "@/theme/theme";

const PROCESSING_STEPS = [
  "Analyzing your inputs...",
  "Understanding patterns...",
  "Building your profile...",
] as const;

export function ChartRevealScreen() {
  const { natalChart, chartReady, isLoading, error } = useAstrology();
  const { updateUser } = useUser();
  const pulse = useRef(new Animated.Value(0)).current;
  const [processingIndex, setProcessingIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      return undefined;
    }

    const stepTimer = setInterval(() => {
      setProcessingIndex((current) => (current + 1) % PROCESSING_STEPS.length);
    }, 1800);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      clearInterval(stepTimer);
      pulse.stopAnimation();
    };
  }, [isLoading, pulse]);

  const handleContinue = async () => {
    await updateUser({
      chartRevealed: true,
    });
    router.push("/intent-setup");
  };

  const coreInsight = useMemo(() => {
    if (!natalChart) {
      return "";
    }

    const sun = natalChart.corePlacements.sun?.signLabel;
    const moon = natalChart.corePlacements.moon?.signLabel;

    if (sun && moon) {
      return `${sun} sun, ${moon} moon. Your inner world is becoming easier to name.`;
    }

    return natalChart.summary;
  }, [natalChart]);

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Insight" currentStep={2} totalSteps={4} />

        {isLoading ? (
          <View style={styles.loadingStage}>
            <Animated.View
              style={[
                styles.loaderGlow,
                {
                  opacity: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.35, 1],
                  }),
                  transform: [
                    {
                      scale: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            />
            <ActivityIndicator size="large" color={theme.colors.text} />
            <Text style={styles.processingText}>{PROCESSING_STEPS[processingIndex]}</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <GlassPanel style={styles.statePanel}>
            <Text style={styles.stateEyebrow}>Chart needs another pass</Text>
            <Text style={styles.stateText}>{error}</Text>
            <GlassButton label="Back to setup" onPress={() => router.back()} />
          </GlassPanel>
        ) : null}

        {!isLoading && chartReady && natalChart ? (
          <View style={styles.revealStage}>
            <Text style={styles.revealEyebrow}>First insight</Text>
            <GlassPanel style={styles.insightCard}>
              <Text style={styles.insightTitle}>Your sky is active.</Text>
              <Text style={styles.insightBody}>{coreInsight}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{natalChart.accuracy === "full_time" ? "Full chart" : "Date-based chart"}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{natalChart.location.label.split(",")[0]}</Text>
                </View>
              </View>
            </GlassPanel>
            <GlassButton label="Continue" onPress={handleContinue} />
          </View>
        ) : null}
      </AtmosphericScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  loadingStage: {
    flex: 1,
    minHeight: 620,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  loaderGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(124,92,255,0.18)",
  },
  processingText: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
    maxWidth: 260,
  },
  statePanel: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  stateEyebrow: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  revealStage: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xl,
    minHeight: 620,
  },
  revealEyebrow: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  insightCard: {
    gap: theme.spacing.md,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  insightTitle: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  insightBody: {
    color: theme.colors.textMuted,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  metaPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  metaText: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
});
