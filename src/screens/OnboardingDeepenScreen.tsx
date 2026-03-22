import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { useCurrentContext } from "@/context";
import {
  FOLLOW_UP_TARGET_COUNT,
  useOnboardingFollowUpEngine,
} from "@/intelligence/onboardingFollowUpEngine";
import { theme } from "@/theme/theme";
import type { FollowUpQuestion } from "@/config/followUpQuestionPool";

function ChoiceButtons({
  question,
  onSelect,
}: {
  question: FollowUpQuestion;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.choiceList}>
      {question.options?.map((option) => {
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={styles.choiceButton}
          >
            <Text style={styles.choiceText}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OnboardingDeepenScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const transition = useRef(new Animated.Value(1)).current;
  const { currentContext } = useCurrentContext();
  const { getNextQuestion, submitAnswer } = useOnboardingFollowUpEngine();
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
  }, [getNextQuestion]);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [completionText, currentQuestion, questionText, transition]);

  const step = Math.min(FOLLOW_UP_TARGET_COUNT, (currentContext?.followUpAnswers?.length ?? 0) + 1);

  const handleSubmitAnswer = async (payload: string) => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitAnswer(currentQuestion, payload);
    setSelectedChoice("");
    setShortAnswer("");
    setIsSubmitting(false);

    if (result.isComplete || !result.nextQuestion?.question) {
      setCompletionText(
        result.summary
          ? `Profile ready. ${result.summary}`
          : "Profile ready. Rah now has enough context to begin.",
      );
      setCurrentQuestion(null);
      setTimeout(() => {
        router.replace("/first-insight");
      }, 1800);
      return;
    }

    setCurrentQuestion(result.nextQuestion.question);
    setQuestionText(result.nextQuestion.questionText);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  };

  const handleContinue = async () => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    const payload = currentQuestion.type === "short_text" ? shortAnswer.trim() : selectedChoice;
    if (!payload) {
      return;
    }
    await handleSubmitAnswer(payload);
  };

  const animatedStyle = {
    opacity: transition,
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
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

          <View style={styles.header}>
            <Text style={styles.kicker}>Deeper context</Text>
            <Text style={styles.progress}>Question {Math.min(step, FOLLOW_UP_TARGET_COUNT)} / {FOLLOW_UP_TARGET_COUNT}</Text>
          </View>

          {isLoading ? (
            <View style={styles.centerStage}>
              <ActivityIndicator color={theme.colors.text} />
              <Text style={styles.helperText}>Listening for the next right question...</Text>
            </View>
          ) : null}

          {!isLoading ? (
            <Animated.View style={[styles.centerStage, animatedStyle]}>
              {currentQuestion ? (
                <>
                  <Text style={styles.questionText}>{questionText}</Text>
                  {currentQuestion.type === "short_text" ? (
                    <GlassInput
                      value={shortAnswer}
                      onChangeText={setShortAnswer}
                      placeholder={currentQuestion.placeholder || "Say it simply"}
                      multiline
                      style={styles.textInput}
                    />
                  ) : (
                    <ChoiceButtons
                      question={currentQuestion}
                      onSelect={(value) => {
                        setSelectedChoice(value);
                        void handleSubmitAnswer(value);
                      }}
                    />
                  )}
                </>
              ) : (
                <Text style={styles.questionText}>{completionText}</Text>
              )}
            </Animated.View>
          ) : null}
        </ScrollView>

        {!isLoading && currentQuestion?.type === "short_text" ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
            <GlassButton
              label={isSubmitting ? "Processing..." : "Continue"}
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
    flexGrow: 1,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  progress: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  centerStage: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xl,
    minHeight: 560,
  },
  questionText: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    textAlign: "center",
  },
  choiceList: {
    gap: 14,
  },
  choiceButton: {
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  choiceText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  textInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  footer: {
    paddingTop: theme.spacing.sm,
  },
});
