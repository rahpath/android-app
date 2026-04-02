import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useCurrentContext, useUser } from "@/context";
import { theme } from "@/theme/theme";
import type { CurrentContextState } from "@/types/domain";

const STEPS = [
  {
    key: "lifeRating",
    question: "How is life feeling lately?",
    options: ["Great", "Okay", "Messy", "Overwhelming"],
  },
  {
    key: "mainLifeArea",
    question: "Which life area feels most charged?",
    options: ["Career", "Relationships", "Purpose", "Money", "Family", "Health"],
  },
  {
    key: "repeatingPattern",
    question: "What pattern feels too familiar?",
    options: [
      "I overthink and delay",
      "I repeat intense dynamics",
      "I lose direction fast",
      "I compare myself too much",
      "I carry stress in my body",
    ],
  },
  {
    key: "supportNeed",
    question: "What would help most right now?",
    options: ["Clarity", "Calm", "Direction", "Validation"],
  },
] as const;

export function ContextSetupScreen() {
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const { updateUser } = useUser();
  const transition = useRef(new Animated.Value(1)).current;
  const [stepIndex, setStepIndex] = useState(0);
  const [summary, setSummary] = useState(currentContext?.currentFocusSummary || "");
  const [isSaving, setIsSaving] = useState(false);

  const isTextStep = stepIndex === STEPS.length;
  const currentStep = isTextStep ? null : STEPS[stepIndex];
  const canContinue = useMemo(() => Boolean(summary.trim()), [summary]);

  const animateIn = () => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  const handleChoice = async (option: string) => {
    if (!currentStep) {
      return;
    }

    await updateCurrentContext({ [currentStep.key]: option } as Partial<CurrentContextState>);
    if (stepIndex < STEPS.length) {
      setStepIndex((current) => current + 1);
      setTimeout(animateIn, 0);
    }
  };

  const handleContinue = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    setIsSaving(true);
    await updateCurrentContext({ currentFocusSummary: summary.trim() });
    await updateUser({
      onboardingCompleted: false,
    });
    setIsSaving(false);
    router.push("/context-deepen");
  };

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Context" currentStep={3} totalSteps={4} />

        <Animated.View
          style={[
            styles.stage,
            {
              opacity: transition,
              transform: [
                {
                  translateY: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.question}>
            {isTextStep ? "One sentence on what's most real right now" : currentStep?.question}
          </Text>

          {isTextStep ? (
            <View style={styles.textStep}>
              <GlassInput
                value={summary}
                onChangeText={setSummary}
                placeholder="A short honest sentence is enough"
                multiline
                textAlignVertical="top"
                style={styles.summaryInput}
              />
              <GlassButton label={isSaving ? "Saving..." : "Go Deeper"} onPress={handleContinue} />
            </View>
          ) : (
            <View style={styles.optionList}>
              {currentStep?.options.map((option) => (
                <Pressable key={option} onPress={() => handleChoice(option)} style={styles.option}>
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </AtmosphericScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xl,
    minHeight: 560,
  },
  question: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  optionList: {
    gap: 14,
  },
  option: {
    minHeight: 72,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  textStep: {
    gap: 16,
  },
  summaryInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
