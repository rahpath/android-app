import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

  const handleAskRah = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isThinking) {
      return;
    }

    setIsThinking(true);
    setPendingMode(trimmedQuestion.toLowerCase().includes("should i") || trimmedQuestion.toLowerCase().includes("decision")
      ? "decision_insight"
      : "ask_rah");
    setQuestion("");
    await askRah(trimmedQuestion);
    setIsThinking(false);
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
                </GlassPanel>
              </View>
            ))
          ) : (
            <GlassPanel style={styles.emptyState}>
              <Text style={styles.answerLabel}>Ask Rah</Text>
              <Text style={styles.answerText}>
                Why do my relationships become intense?
              </Text>
            </GlassPanel>
          )}

          {isThinking ? (
            <GlassPanel style={styles.typingBubble}>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={theme.colors.text} />
                <Text style={styles.answerText}>
                  {pendingMode === "decision_insight" ? "Weighing your decision" : "Reading your thread"}{typingDots}
                </Text>
              </View>
            </GlassPanel>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
          <GlassInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask Rah about your patterns, feelings, or relationships"
            multiline
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120)}
          />
          <GlassButton label="Send" onPress={handleAskRah} />
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
    backgroundColor: "rgba(11,15,42,0.86)",
  },
});
