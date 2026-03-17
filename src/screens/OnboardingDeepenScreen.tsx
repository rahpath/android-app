import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useCurrentContext } from "@/context";
import { FOLLOW_UP_TARGET_COUNT, useOnboardingFollowUpEngine } from "@/intelligence/onboardingFollowUpEngine";
import { enterRahSurface } from "@/navigation/rahNavigation";
import { theme } from "@/theme/theme";
import type { FollowUpQuestion } from "@/config/followUpQuestionPool";

function ChoiceChips({
  question,
  selectedValue,
  onSelect,
}: {
  question: FollowUpQuestion;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {question.options?.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <Pressable key={option.value} onPress={() => onSelect(option.value)}>
            <GlassCard style={[styles.chip, isActive && styles.chipActive]}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
            </GlassCard>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OnboardingDeepenScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const { currentContext } = useCurrentContext();
  const { getSession, getNextQuestion, submitAnswer } = useOnboardingFollowUpEngine();
  const [currentQuestion, setCurrentQuestion] = useState<FollowUpQuestion | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [selectedChoice, setSelectedChoice] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionText, setCompletionText] = useState("");

  useEffect(() => {
    getNextQuestion()
      .then(({ question, questionText: nextText }) => {
        setCurrentQuestion(question);
        setQuestionText(nextText);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const step = Math.min(FOLLOW_UP_TARGET_COUNT, (currentContext?.followUpAnswers?.length ?? 0) + 1);

  const handleContinue = async () => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    const payload = currentQuestion.type === "short_text" ? shortAnswer.trim() : selectedChoice;
    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitAnswer(currentQuestion, payload);
    setSelectedChoice("");
    setShortAnswer("");
    setIsSubmitting(false);

    if (result.isComplete) {
      setCompletionText(
        result.summary
          ? `Rah now understands your current landscape with more depth: ${result.summary}`
          : "Rah now has enough context to begin with real depth.",
      );
      setCurrentQuestion(null);
      setTimeout(() => {
        enterRahSurface("/home");
      }, 1800);
      return;
    }

    if (!result.nextQuestion?.question) {
      setCompletionText("Rah now has enough context to begin with real depth.");
      setCurrentQuestion(null);
      setTimeout(() => {
        enterRahSurface("/home");
      }, 1800);
      return;
    }

    setCurrentQuestion(result.nextQuestion.question);
    setQuestionText(result.nextQuestion.questionText);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  return (
    <GlassContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingProgress stageLabel="Rah" currentStep={4} totalSteps={4} />

          <GlassPanel style={styles.hero}>
            <Text style={styles.kicker}>Adaptive Listening</Text>
            <Text style={styles.title}>Tuning to what matters underneath the surface</Text>
            <Text style={styles.subtitle}>
              These next questions are chosen from your chart, your current setup, and the emotional pattern already captured.
            </Text>
          </GlassPanel>

          {(currentContext?.followUpAnswers?.length ?? 0) > 0 ? (
            <View style={styles.historyWrap}>
              {currentContext?.followUpAnswers.map((item, index) => (
                <View key={`${item.questionId}-${index}`} style={styles.messageGroup}>
                  <GlassPanel style={styles.rahBubble}>
                    <Text style={styles.label}>Rah</Text>
                    <Text style={styles.message}>{item.question}</Text>
                  </GlassPanel>
                  <GlassPanel style={styles.userBubble}>
                    <Text style={styles.label}>You</Text>
                    <Text style={styles.message}>{item.answer}</Text>
                  </GlassPanel>
                </View>
              ))}
            </View>
          ) : null}

          {isLoading ? (
            <GlassPanel style={styles.loadingPanel}>
              <ActivityIndicator color={theme.colors.text} />
              <Text style={styles.message}>Choosing the right place to go deeper.</Text>
            </GlassPanel>
          ) : null}

          {!isLoading && currentQuestion ? (
            <GlassPanel style={styles.questionPanel}>
              <Text style={styles.label}>Rah</Text>
              <Text style={styles.questionText}>{questionText}</Text>
              <Text style={styles.progressHint}>Deeper question {step} of {FOLLOW_UP_TARGET_COUNT}</Text>
            </GlassPanel>
          ) : null}

          {!isLoading && !currentQuestion && completionText ? (
            <GlassPanel style={styles.questionPanel}>
              <Text style={styles.label}>Rah</Text>
              <Text style={styles.message}>{completionText}</Text>
            </GlassPanel>
          ) : null}
        </ScrollView>

        {!isLoading && currentQuestion ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
            {currentQuestion.type === "short_text" ? (
              <GlassInput
                value={shortAnswer}
                onChangeText={setShortAnswer}
                placeholder={currentQuestion.placeholder || "Say it simply"}
                multiline
                style={styles.textInput}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
              />
            ) : (
              <ChoiceChips
                question={currentQuestion}
                selectedValue={selectedChoice}
                onSelect={setSelectedChoice}
              />
            )}
            <GlassButton
              label={isSubmitting ? "Listening..." : "Continue"}
              onPress={handleContinue}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.lg,
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
  historyWrap: {
    gap: theme.spacing.sm,
  },
  messageGroup: {
    gap: theme.spacing.sm,
  },
  rahBubble: {
    marginRight: theme.spacing.xl,
  },
  userBubble: {
    marginLeft: theme.spacing.xl,
  },
  label: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  questionPanel: {
    gap: theme.spacing.sm,
  },
  questionText: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    lineHeight: 30,
  },
  progressHint: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
  },
  loadingPanel: {
    gap: theme.spacing.sm,
  },
  composer: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    backgroundColor: "rgba(11,15,42,0.88)",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderColor: "rgba(255,255,255,0.18)",
  },
  chipActive: {
    backgroundColor: "rgba(107,124,255,0.28)",
    borderColor: "rgba(163,139,255,0.8)",
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.colors.text,
  },
  textInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
