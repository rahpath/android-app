import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type OnboardingProgressProps = {
  stageLabel: string;
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgress({
  stageLabel,
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const progress = Math.max(0, Math.min(1, currentStep / totalSteps));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.stage}>{stageLabel}</Text>
        <Text style={styles.meta}>
          {currentStep} / {totalSteps}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stage: {
    color: "#243754",
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  meta: {
    color: "rgba(36,55,84,0.64)",
    fontSize: theme.typography.caption,
    fontWeight: "600",
  },
  track: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(36,55,84,0.10)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: theme.radius.pill,
    backgroundColor: "#243754",
  },
});
