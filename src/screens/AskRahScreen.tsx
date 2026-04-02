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

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useMemory } from "@/context";
import { useRahEngine } from "@/intelligence/rahEngine";
import { theme } from "@/theme/theme";

const SUGGESTED_PROMPTS = [
  "Why do I feel stuck?",
  "What should I do next?",
  "Why does this keep repeating?",
] as const;

export function AskRahScreen() {
  const insets = useSafeAreaInsets();
  const { memoryEvents } = useMemory();
  const { askRah } = useRahEngine();
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [typingDots, setTypingDots] = useState(".");
  const [pendingMode, setPendingMode] = useState<"ask_rah" | "decision_insight">("ask_rah");
  const scrollViewRef = useRef<ScrollView | null>(null);

  const conversations = memoryEvents.filter((event) => event.tags.includes("ask-rah"));

  useEffect(() => {
    if (!isThinking) {
      setTypingDots(".");
      return;
    }

    const interval = setInterval(() => {
      setTypingDots((current) => (current.length >= 3 ? "." : `${current}.`));
    }, 300);

    return () => clearInterval(interval);
  }, [isThinking]);

  const handleAskRah = async (overrideQuestion?: string) => {
    const trimmedQuestion = (overrideQuestion ?? question).trim();
    if (!trimmedQuestion || isThinking) {
      return;
    }

    setIsThinking(true);
    setPendingMode(
      trimmedQuestion.toLowerCase().includes("should i") || trimmedQuestion.toLowerCase().includes("decision")
        ? "decision_insight"
        : "ask_rah",
    );
    setQuestion("");
    await askRah(trimmedQuestion);
    setIsThinking(false);
  };

  const handlePromptPress = (prompt: string) => {
    setQuestion(prompt);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const handleQuickFollowUp = async (prefix: "Explain more" | "What should I do?", originalQuestion: string) => {
    if (isThinking) {
      return;
    }

    const nextQuestion =
      prefix === "Explain more"
        ? `${prefix} about this: ${originalQuestion}`
        : `${prefix} about this situation: ${originalQuestion}`;

    await handleAskRah(nextQuestion);
  };

  return (
    <RahAppShell activePath="/ask">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.historyScroll}
          contentContainerStyle={styles.history}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <GlassPanel style={styles.hero}>
            <Text style={styles.heroKicker}>Ask Rah</Text>
            <Text style={styles.heroTitle}>Talk through your path in real time</Text>
            <Text style={styles.heroText}>
              Reflection, pattern, and decision questions flow through one thread. The lens shifts quietly underneath.
            </Text>
          </GlassPanel>

          {conversations.length > 0 ? (
            conversations.map((event) => (
              <View key={event.id} style={styles.messageGroup}>
                <GlassPanel style={styles.userBubble}>
                  <Text style={styles.questionLabel}>You</Text>
                  <Text style={styles.questionText}>{event.title}</Text>
                </GlassPanel>
                <GlassPanel style={styles.rahBubble}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.answerLabel}>Rah</Text>
                    <Text style={styles.modePill}>
                      {event.tags.includes("decision") ? "Decision lens" : "Reflect mode"}
                    </Text>
                  </View>
                  <Text style={styles.answerText}>{event.description}</Text>
                  <View style={styles.followUpRow}>
                    <Pressable onPress={() => void handleQuickFollowUp("Explain more", event.title)}>
                      <Text style={styles.followUpAction}>Explain more</Text>
                    </Pressable>
                    <Pressable onPress={() => void handleQuickFollowUp("What should I do?", event.title)}>
                      <Text style={styles.followUpAction}>What should I do?</Text>
                    </Pressable>
                  </View>
                </GlassPanel>
              </View>
            ))
          ) : (
            <GlassPanel style={styles.emptyState}>
              <Text style={styles.answerLabel}>Ask Rah</Text>
              <Text style={styles.answerText}>Start with one clear question and let the thread build from there.</Text>
              <View style={styles.promptList}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Pressable key={prompt} style={styles.promptChip} onPress={() => handlePromptPress(prompt)}>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </GlassPanel>
          )}

          {isThinking ? (
            <GlassPanel style={styles.typingBubble}>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={theme.colors.text} />
                <Text style={styles.answerText}>
                  {pendingMode === "decision_insight" ? "Weighing your decision" : "Reading your thread"}
                  {typingDots}
                </Text>
              </View>
            </GlassPanel>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
          <GlassInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask anything about your life..."
            multiline
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
          />
          <GlassButton label="Send" onPress={() => void handleAskRah()} />
        </View>
      </KeyboardAvoidingView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  history: {
    flexGrow: 1,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  hero: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  heroKicker: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  historyScroll: {
    flex: 1,
  },
  messageGroup: {
    gap: theme.spacing.sm,
  },
  userBubble: {
    marginLeft: theme.spacing.xl,
  },
  rahBubble: {
    marginRight: theme.spacing.xl,
  },
  emptyState: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  questionLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  answerLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  modePill: {
    color: theme.colors.accentWarm,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  questionText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  answerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  promptList: {
    gap: theme.spacing.sm,
  },
  promptChip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
  },
  promptText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  followUpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  followUpAction: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  typingBubble: {
    marginRight: theme.spacing.xl,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  composer: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    backgroundColor: "rgba(241,236,227,0.68)",
  },
});
