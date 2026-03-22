import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useCurrentContext } from "@/context";
import { theme } from "@/theme/theme";
import type { ContextIntent } from "@/types/domain";

const INTENT_OPTIONS: Array<{ label: string; value: ContextIntent }> = [
  { label: "Understand myself", value: "understand_myself" },
  { label: "Decision support", value: "decision_support" },
  { label: "Relationship clarity", value: "relationship_clarity" },
  { label: "Career direction", value: "career_direction" },
  { label: "Emotional grounding", value: "emotional_grounding" },
];

export function IntentSetupScreen() {
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const selectedIntent = currentContext?.activeIntent || "";

  const handleSelect = async (value: ContextIntent) => {
    await updateCurrentContext({
      activeIntent: value,
    });
    router.push("/context-setup");
  };

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Intent" currentStep={3} totalSteps={4} />

        <View style={styles.hero}>
          <Text style={styles.kicker}>Current focus</Text>
          <Text style={styles.title}>What feels most important right now?</Text>
        </View>

        <View style={styles.optionList}>
          {INTENT_OPTIONS.map((option) => {
            const isActive = selectedIntent === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[styles.option, isActive && styles.optionActive]}
              >
                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </AtmosphericScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  kicker: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.8,
    maxWidth: 280,
  },
  optionList: {
    gap: 14,
  },
  option: {
    minHeight: 74,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  optionActive: {
    backgroundColor: "rgba(124,92,255,0.2)",
    borderColor: "rgba(183,156,255,0.55)",
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  optionText: {
    color: theme.colors.textMuted,
    fontSize: 17,
    fontWeight: "700",
  },
  optionTextActive: {
    color: theme.colors.text,
  },
});
