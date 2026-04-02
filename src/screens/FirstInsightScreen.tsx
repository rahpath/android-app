import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useAstrology, useCurrentContext } from "@/context";
import { theme } from "@/theme/theme";

function buildInsight(signal?: string, support?: string) {
  if (signal && support) {
    return `You are entering ${signal.toLowerCase()}, and ${support.toLowerCase()} matters most now.`;
  }

  return "You are entering a phase of clarity, but decisions may feel heavy.";
}

export function FirstInsightScreen() {
  const { getPrimarySignal } = useAstrology();
  const { currentContext } = useCurrentContext();
  const primarySignal = getPrimarySignal();

  return (
    <GlassContainer>
      <View style={styles.wrapper}>
        <OnboardingProgress stageLabel="First Insight" currentStep={6} totalSteps={8} />
        <View style={styles.stage}>
          <GlassPanel style={styles.card}>
            <Text style={styles.eyebrow}>First insight</Text>
            <Text style={styles.copy}>
              {buildInsight(primarySignal?.signalType, currentContext?.supportNeed)}
            </Text>
          </GlassPanel>
          <GlassButton label="Continue" onPress={() => router.push("/pattern-intro")} />
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 20,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  card: {
    gap: 14,
    shadowColor: "rgba(96,132,188,0.30)",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  eyebrow: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  copy: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
  },
});
