import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useMemory } from "@/context";
import { theme } from "@/theme/theme";

const MOODS = [
  { emoji: "\uD83D\uDE0C", label: "Calm" },
  { emoji: "\uD83D\uDE42", label: "Good" },
  { emoji: "\uD83D\uDE35", label: "Drained" },
  { emoji: "\uD83D\uDE14", label: "Heavy" },
  { emoji: "\uD83D\uDD25", label: "Intense" },
] as const;

const ENERGY_LEVELS = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
] as const;

const CATEGORY_OPTIONS = ["Work", "Love", "Health", "Money", "Family", "Self", "Social"] as const;

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function getConsecutiveStreak(dates: string[]) {
  const uniqueDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const cursor = new Date();

  for (const item of uniqueDates) {
    if (normalizeDate(cursor.toISOString()) !== item) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildReflectionSummary({
  mood,
  energy,
  categories,
  eventText,
}: {
  mood: string;
  energy: number;
  categories: string[];
  eventText: string;
}) {
  const energyTone = energy <= 2 ? "low" : energy === 3 ? "mixed" : "steady";
  const categoryText = categories.slice(0, 2).join(" and ").toLowerCase() || "your inner world";
  return `${mood} energy felt ${energyTone} around ${categoryText}. ${eventText || "Something important asked for your attention."}`.slice(0, 120);
}

function buildActionSuggestion(mood: string, energy: number) {
  if (mood === "Heavy" || energy <= 2) {
    return "Take space before reacting tomorrow.";
  }

  if (mood === "Intense") {
    return "Slow the pace before making fast decisions.";
  }

  return "Protect one calm moment before the day begins.";
}

export function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { memoryEvents, addMemoryEvent } = useMemory();
  const transition = useRef(new Animated.Value(1)).current;
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [eventText, setEventText] = useState("");
  const [freeWrite, setFreeWrite] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [stepIndex, showResult, transition]);

  useEffect(() => () => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
    }
  }, []);

  const reflectEvents = useMemo(
    () => memoryEvents.filter((event) => event.tags.includes("reflect-flow")),
    [memoryEvents],
  );

  const similarMoodCount = useMemo(
    () => reflectEvents.filter((event) => event.tags.includes(`mood:${mood.toLowerCase()}`)).length,
    [mood, reflectEvents],
  );

  const streak = useMemo(
    () => getConsecutiveStreak(reflectEvents.map((event) => normalizeDate(event.date))),
    [reflectEvents],
  );

  const reflectionSummary = useMemo(
    () => buildReflectionSummary({
      mood: mood || "Mixed",
      energy: energy || 3,
      categories,
      eventText,
    }),
    [categories, energy, eventText, mood],
  );

  const microInsight = useMemo(() => {
    const count = similarMoodCount + (mood ? 1 : 0);
    return `This feeling appeared ${count} time${count === 1 ? "" : "s"} this week.`;
  }, [mood, similarMoodCount]);

  const actionSuggestion = useMemo(
    () => buildActionSuggestion(mood || "Good", energy || 3),
    [energy, mood],
  );

  const animateNext = (nextIndex: number) => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
    }

    autoNextTimeoutRef.current = setTimeout(() => {
      setStepIndex(nextIndex);
    }, 420);
  };

  const handleMoodSelect = (value: string) => {
    setMood(value);
    animateNext(1);
  };

  const handleEnergySelect = (value: number) => {
    setEnergy(value);
    animateNext(2);
  };

  const handleCategoryToggle = (value: string) => {
    setCategories((current) => {
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }

      if (next.length > 0) {
        autoNextTimeoutRef.current = setTimeout(() => {
          setStepIndex(3);
        }, 700);
      }

      return next;
    });
  };

  const handleEventContinue = () => {
    if (!eventText.trim()) {
      return;
    }

    setStepIndex(4);
  };

  const handleSaveReflection = async () => {
    if (!eventText.trim() || isSaving) {
      return;
    }

    setIsSaving(true);
    await addMemoryEvent({
      title: `${mood || "Reflect"} day`,
      description: [eventText.trim(), freeWrite.trim()].filter(Boolean).join(" "),
      date: new Date().toISOString(),
      type: "reflection",
      tags: [
        "reflect-flow",
        `mood:${(mood || "mixed").toLowerCase()}`,
        `energy:${energy || 3}`,
        ...(categories.map((item) => item.toLowerCase())),
      ],
    });
    setIsSaving(false);
    setShowResult(true);
  };

  const animatedStyle = {
    opacity: transition,
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
    ],
  };

  return (
    <RahAppShell activePath="/journey">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        style={styles.flex}
      >
        <View style={styles.wrapper}>
          <Animated.View style={[styles.stage, animatedStyle]}>
            {!showResult ? (
              <>
                <Text style={styles.stepLabel}>Reflect</Text>
                <Text style={styles.question}>
                  {stepIndex === 0
                    ? "How was your day?"
                    : stepIndex === 1
                      ? "How was your energy today?"
                      : stepIndex === 2
                        ? "Which areas affected your day?"
                        : stepIndex === 3
                          ? "What made today feel like this?"
                          : "Write anything you want to remember (optional)"}
                </Text>

                {stepIndex === 0 ? (
                  <View style={styles.emojiRow}>
                    {MOODS.map((item) => (
                      <Pressable key={item.label} style={styles.emojiButton} onPress={() => handleMoodSelect(item.label)}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        <Text style={styles.emojiLabel}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {stepIndex === 1 ? (
                  <View style={styles.scaleRow}>
                    {ENERGY_LEVELS.map((item) => (
                      <Pressable key={item.value} style={styles.scaleButton} onPress={() => handleEnergySelect(item.value)}>
                        <Text style={styles.scaleText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {stepIndex === 2 ? (
                  <View style={styles.categoryWrap}>
                    {CATEGORY_OPTIONS.map((item) => {
                      const active = categories.includes(item);
                      return (
                        <Pressable
                          key={item}
                          style={[styles.categoryButton, active && styles.categoryButtonActive]}
                          onPress={() => handleCategoryToggle(item)}
                        >
                          <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {stepIndex === 3 ? (
                  <View style={styles.textStep}>
                    <GlassInput
                      value={eventText}
                      onChangeText={setEventText}
                      placeholder="A short note is enough"
                      multiline
                      style={styles.textInput}
                    />
                    <GlassButton label="Continue" onPress={handleEventContinue} />
                  </View>
                ) : null}

                {stepIndex === 4 ? (
                  <View style={styles.textStep}>
                    <GlassInput
                      value={freeWrite}
                      onChangeText={setFreeWrite}
                      placeholder="Optional"
                      multiline
                      style={styles.textInput}
                    />
                    <GlassButton label={isSaving ? "Saving..." : "Continue"} onPress={handleSaveReflection} />
                  </View>
                ) : null}
              </>
            ) : (
              <GlassPanel style={styles.resultPanel}>
                <Text style={styles.resultTitle}>Reflection</Text>
                <Text style={styles.resultText}>{reflectionSummary}</Text>
                <Text style={styles.resultMeta}>{microInsight}</Text>
                <Text style={styles.resultMeta}>{actionSuggestion}</Text>
                <Text style={styles.resultStreak}>{"\uD83D\uDD25"} {Math.max(streak, 1)} day streak</Text>
              </GlassPanel>
            )}
          </Animated.View>
        </View>
        {!showResult ? <View style={{ paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }} /> : null}
      </KeyboardAvoidingView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xl,
  },
  stepLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  question: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  emojiButton: {
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 8,
  },
  emoji: {
    fontSize: 28,
  },
  emojiLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  scaleButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },
  scaleText: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  categoryButton: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },
  categoryButtonActive: {
    backgroundColor: "rgba(18,55,101,0.14)",
    borderColor: "rgba(79,104,129,0.54)",
  },
  categoryText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: theme.colors.text,
  },
  textStep: {
    gap: theme.spacing.md,
  },
  textInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  resultPanel: {
    gap: theme.spacing.md,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  resultText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  resultMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  resultStreak: {
    color: theme.colors.secondary,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
});
