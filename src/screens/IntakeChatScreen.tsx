import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { getIntakeQuestionById } from "@/config/intakeQuestionPool";
import { useAdaptiveIntakeEngine } from "@/intelligence/adaptiveIntakeEngine";
import { theme } from "@/theme/theme";
import type {
  AdaptiveIntakeSession,
  BirthDataAnswer,
  IntakeQuestion,
  IntakeQuestionOption,
} from "@/types/domain";

const PARTICLES = [
  { top: "12%" as const, left: "12%" as const, size: 10, delay: 0 },
  { top: "18%" as const, left: "78%" as const, size: 6, delay: 400 },
  { top: "38%" as const, left: "15%" as const, size: 8, delay: 900 },
  { top: "46%" as const, left: "82%" as const, size: 12, delay: 300 },
  { top: "70%" as const, left: "20%" as const, size: 7, delay: 700 },
  { top: "82%" as const, left: "72%" as const, size: 9, delay: 200 },
];

function AmbientParticles() {
  const values = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(PARTICLES[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [values]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((particle, index) => (
        <Animated.View
          key={`${particle.top}-${particle.left}`}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              top: particle.top,
              left: particle.left,
              opacity: values[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.45],
              }),
              transform: [
                {
                  translateY: values[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, -12],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ChoiceChips({
  options,
  selectedValue,
  onSelect,
}: {
  options: IntakeQuestionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <Pressable key={option.value} onPress={() => onSelect(option.value)}>
            <GlassCard style={[styles.chip, isActive && styles.chipActive]}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {option.label}
              </Text>
            </GlassCard>
          </Pressable>
        );
      })}
    </View>
  );
}

export function IntakeChatScreen() {
  const { getCurrentQuestion, submitAnswer } = useAdaptiveIntakeEngine();
  const [session, setSession] = useState<AdaptiveIntakeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<IntakeQuestion | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [totalSteps, setTotalSteps] = useState(6);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [birthData, setBirthData] = useState<BirthDataAnswer>({
    birthDate: "",
    birthTime: "",
    birthLocation: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typingDots, setTypingDots] = useState(".");
  const questionAnim = useRef(new Animated.Value(0)).current;

  const hydrateQuestion = (
    nextQuestion: IntakeQuestion | null,
    nextQuestionText: string,
    nextSession: AdaptiveIntakeSession,
    expectedSteps: number,
  ) => {
    setCurrentQuestion(nextQuestion);
    setQuestionText(nextQuestionText);
    setSession(nextSession);
    setTotalSteps(expectedSteps);
    setSelectedChoice("");
    setShortAnswer("");
    setBirthData({
      birthDate: "",
      birthTime: "",
      birthLocation: "",
    });
    setIsTyping(true);
  };

  useEffect(() => {
    getCurrentQuestion()
      .then(({ session: nextSession, question, questionText: nextQuestionText, totalExpectedSteps }) => {
        hydrateQuestion(question, nextQuestionText, nextSession, totalExpectedSteps);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isTyping) {
      return;
    }

    setTypingDots(".");
    const dotInterval = setInterval(() => {
      setTypingDots((current) => (current.length >= 3 ? "." : `${current}.`));
    }, 260);

    const revealTimeout = setTimeout(() => {
      setIsTyping(false);
      questionAnim.setValue(0);
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }, 720);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(revealTimeout);
    };
  }, [isTyping, questionAnim]);

  const stepNumber = Math.min(totalSteps, (session?.questionHistory.length ?? 0) + 1);

  const buildAnswerPayload = () => {
    if (!currentQuestion) {
      return null;
    }

    if (currentQuestion.type === "birth_data") {
      if (!birthData.birthDate.trim() || !birthData.birthLocation.trim()) {
        return null;
      }
      return birthData;
    }

    if (currentQuestion.type === "short_text") {
      return shortAnswer.trim() || null;
    }

    return selectedChoice || null;
  };

  const handleNext = async () => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    const payload = buildAnswerPayload();
    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitAnswer(currentQuestion.id, payload);
    setIsSubmitting(false);

    if (result.isComplete) {
      setQuestionText(result.questionText);
      setCurrentQuestion(null);
      setSession(result.session);
      setTimeout(() => {
        router.replace("/journey");
      }, 1600);
      return;
    }

    hydrateQuestion(
      result.question,
      result.questionText,
      result.session,
      result.totalExpectedSteps,
    );
  };

  const renderHistory = () => {
    if (!session) {
      return null;
    }

    return session.questionHistory.map((questionId) => {
      const historicQuestion = getIntakeQuestionById(questionId);
      const historicAnswer = session.answers.find((answer) => answer.questionId === questionId);
      if (!historicQuestion || !historicAnswer) {
        return null;
      }

      const answerText =
        typeof historicAnswer.answer === "string"
          ? historicAnswer.answer
          : Array.isArray(historicAnswer.answer)
            ? historicAnswer.answer.join(", ")
            : [historicAnswer.answer.birthDate, historicAnswer.answer.birthTime, historicAnswer.answer.birthLocation]
                .filter(Boolean)
                .join(" | ");

      return (
        <View key={questionId} style={styles.messageGroup}>
          <GlassPanel style={styles.rahBubble}>
            <Text style={styles.rahLabel}>Rah</Text>
            <Text style={styles.messageText}>{historicQuestion.question}</Text>
          </GlassPanel>
          <GlassPanel style={styles.userBubble}>
            <Text style={styles.userLabel}>You</Text>
            <Text style={styles.messageText}>{answerText}</Text>
          </GlassPanel>
        </View>
      );
    });
  };

  const renderAnswerUI = () => {
    if (!currentQuestion) {
      return (
        <GlassPanel style={styles.completionPanel}>
          <Text style={styles.messageText}>{questionText}</Text>
        </GlassPanel>
      );
    }

    if (currentQuestion.type === "birth_data") {
      return (
        <View style={styles.answerBlock}>
          <GlassInput
            value={birthData.birthDate}
            onChangeText={(value) => setBirthData((current) => ({ ...current, birthDate: value }))}
            placeholder="Date of birth (YYYY-MM-DD)"
          />
          <GlassInput
            value={birthData.birthTime}
            onChangeText={(value) => setBirthData((current) => ({ ...current, birthTime: value }))}
            placeholder="Birth time (optional)"
          />
          <GlassInput
            value={birthData.birthLocation}
            onChangeText={(value) =>
              setBirthData((current) => ({ ...current, birthLocation: value }))
            }
            placeholder="Birth city"
          />
        </View>
      );
    }

    if (currentQuestion.type === "short_text") {
      return (
        <GlassInput
          value={shortAnswer}
          onChangeText={setShortAnswer}
          placeholder={currentQuestion.placeholder || "Keep it honest and simple"}
          multiline
          textAlignVertical="top"
          style={styles.shortInput}
        />
      );
    }

    return (
      <ChoiceChips
        options={currentQuestion.options ?? []}
        selectedValue={selectedChoice}
        onSelect={setSelectedChoice}
      />
    );
  };

  if (isLoading) {
    return (
      <GlassContainer>
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.colors.text} />
          <Text style={styles.loadingText}>Opening your reflection funnel...</Text>
        </View>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <AmbientParticles />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Step {stepNumber} of {totalSteps}</Text>
          <Text style={styles.progressHint}>Context funnel</Text>
        </View>

        {renderHistory()}

        <Animated.View
          style={[
            styles.currentQuestionWrap,
            {
              opacity: questionAnim,
              transform: [
                {
                  translateY: questionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <GlassPanel style={styles.rahBubble}>
            <Text style={styles.rahLabel}>Rah</Text>
            <Text style={styles.currentQuestionText}>
              {isTyping ? `Tuning in${typingDots}` : questionText}
            </Text>
          </GlassPanel>
        </Animated.View>

        {!isTyping ? (
          <View style={styles.inputPanel}>
            {renderAnswerUI()}
            {currentQuestion ? (
              <GlassButton
                label={isSubmitting ? "Thinking..." : "Next"}
                onPress={handleNext}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(163,139,255,0.55)",
    shadowColor: "rgba(163,139,255,0.7)",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
  },
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  progressHint: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
  },
  messageGroup: {
    gap: theme.spacing.sm,
  },
  rahBubble: {
    marginRight: theme.spacing.xl,
    borderColor: "rgba(163,139,255,0.45)",
    shadowColor: "rgba(163,139,255,0.6)",
  },
  userBubble: {
    marginLeft: theme.spacing.xl,
  },
  currentQuestionWrap: {
    marginTop: theme.spacing.sm,
  },
  rahLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  userLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  currentQuestionText: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    lineHeight: 30,
  },
  inputPanel: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  answerBlock: {
    gap: theme.spacing.sm,
  },
  shortInput: {
    minHeight: 130,
    textAlignVertical: "top",
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
  completionPanel: {
    marginTop: theme.spacing.sm,
  },
});
