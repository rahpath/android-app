import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useCurrentContext } from "@/context";
import { theme } from "@/theme/theme";
import type { ContextIntent } from "@/types/domain";

const INTENT_OPTIONS: Array<{ label: string; value: ContextIntent; description: string }> = [
  {
    label: "Understand Myself",
    value: "understand_myself",
    description: "See your emotional patterns and inner wiring more clearly.",
  },
  {
    label: "Decision Support",
    value: "decision_support",
    description: "Bring real choices to Rah and get aligned perspective.",
  },
  {
    label: "Relationship Clarity",
    value: "relationship_clarity",
    description: "Understand dynamics, attraction, and repeating loops.",
  },
  {
    label: "Career Direction",
    value: "career_direction",
    description: "Find clearer timing and language for your next move.",
  },
  {
    label: "Emotional Grounding",
    value: "emotional_grounding",
    description: "Use Rah to feel steadier and less internally chaotic.",
  },
];

export function IntentSetupScreen() {
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const selectedIntent = currentContext?.activeIntent || "";

  const handleContinue = async () => {
    if (!selectedIntent) {
      return;
    }

    await updateCurrentContext({
      activeIntent: selectedIntent,
    });
    router.push("/context-setup");
  };

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Intent" currentStep={3} totalSteps={4} />
        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>Intent</Text>
          <Text style={styles.title}>What do you want Rah to help with most right now?</Text>
          <Text style={styles.subtitle}>
            This shapes the tone of your dashboard, daily insights, and chat guidance from the beginning.
          </Text>
        </GlassPanel>

        <View style={styles.optionList}>
          {INTENT_OPTIONS.map((option) => {
            const isActive = selectedIntent === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => updateCurrentContext({ activeIntent: option.value })}
              >
                <GlassCard style={[styles.intentCard, isActive && styles.intentCardActive]}>
                  <Text style={styles.intentTitle}>{option.label}</Text>
                  <Text style={styles.intentDescription}>{option.description}</Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <GlassButton label="Continue" onPress={handleContinue} />
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
  optionList: {
    gap: theme.spacing.sm,
  },
  intentCard: {
    borderColor: "rgba(255,255,255,0.18)",
    gap: theme.spacing.xs,
  },
  intentCardActive: {
    borderColor: "rgba(163,139,255,0.85)",
    backgroundColor: "rgba(107,124,255,0.22)",
  },
  intentTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  intentDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
});
