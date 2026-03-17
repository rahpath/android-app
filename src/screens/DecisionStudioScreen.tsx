import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DecisionSectionCard } from "@/components/decision/DecisionSectionCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { RahAppShell } from "@/components/shell/RahAppShell";
import { useDecision } from "@/context";
import { useRahEngine } from "@/intelligence/rahEngine";
import { theme } from "@/theme/theme";
import type { DecisionInsightSections, DecisionUrgency, Insight } from "@/types/domain";

const urgencyOptions: Array<{ value: DecisionUrgency; label: string; hint: string }> = [
  { value: "right_now", label: "Need clarity now", hint: "Prioritizes immediate friction and timing pressure." },
  { value: "soon", label: "This week", hint: "Reads as active, but not panicked." },
  { value: "open_timeline", label: "No rush yet", hint: "Leans into pattern and alignment over urgency." },
];

function UrgencyChips({
  value,
  onChange,
}: {
  value: DecisionUrgency;
  onChange: (nextValue: DecisionUrgency) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {urgencyOptions.map((option) => {
        const active = option.value === value;

        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)}>
            <GlassPanel style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
              <Text style={[styles.chipHint, active && styles.chipHintActive]}>{option.hint}</Text>
            </GlassPanel>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DecisionStudioScreen() {
  const { decisions, getDecisionNeedingOutcome } = useDecision();
  const { generateDecisionInsight, logDecisionOutcome } = useRahEngine();
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [biggestFear, setBiggestFear] = useState("");
  const [urgency, setUrgency] = useState<DecisionUrgency>("soon");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Insight | null>(null);
  const [sections, setSections] = useState<DecisionInsightSections | null>(null);
  const [chosenOption, setChosenOption] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [emotionalOutcome, setEmotionalOutcome] = useState("");
  const [wouldChooseAgain, setWouldChooseAgain] = useState<"yes" | "no" | "unsure" | "">("");
  const [isLoggingOutcome, setIsLoggingOutcome] = useState(false);
  const pulse = useRef(new Animated.Value(0.4)).current;

  const latestDecision = decisions[0] ?? null;
  const decisionNeedingOutcome = getDecisionNeedingOutcome();
  const canSubmit = useMemo(
    () => Boolean(title.trim() && situation.trim() && optionA.trim() && optionB.trim()),
    [title, situation, optionA, optionB],
  );
  const canLogOutcome = Boolean(
    decisionNeedingOutcome
      && chosenOption.trim()
      && outcomeSummary.trim()
      && emotionalOutcome.trim()
      && wouldChooseAgain,
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 4200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    if (!decisionNeedingOutcome) {
      setChosenOption("");
      return;
    }

    setChosenOption(decisionNeedingOutcome.chosenOption || decisionNeedingOutcome.options[0] || "");
    setOutcomeSummary(decisionNeedingOutcome.outcomeSummary || "");
    setEmotionalOutcome(decisionNeedingOutcome.emotionalOutcome || "");
    setWouldChooseAgain(decisionNeedingOutcome.wouldChooseAgain || "");
  }, [decisionNeedingOutcome]);

  const handleAnalyze = async () => {
    if (!canSubmit || isLoading) {
      return;
    }

    setIsLoading(true);
    const next = await generateDecisionInsight({
      title: title.trim(),
      situation: situation.trim(),
      options: [optionA, optionB, optionC].map((value) => value.trim()).filter(Boolean),
      desiredOutcome: desiredOutcome.trim(),
      biggestFear: biggestFear.trim(),
      urgency,
    });
    setResult(next.insight);
    setSections(next.sections);
    setIsLoading(false);
  };

  const handleLogOutcome = async () => {
    if (!decisionNeedingOutcome || !canLogOutcome || isLoggingOutcome) {
      return;
    }

    setIsLoggingOutcome(true);
    const next = await logDecisionOutcome({
      decisionId: decisionNeedingOutcome.id,
      title: decisionNeedingOutcome.title,
      chosenOption: chosenOption.trim(),
      outcomeSummary: outcomeSummary.trim(),
      emotionalOutcome: emotionalOutcome.trim(),
      wouldChooseAgain,
    });
    setResult(next.insight);
    setIsLoggingOutcome(false);
  };

  return (
    <RahAppShell activePath="/decision">
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroGlow, { opacity: pulse }]} />

        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>Decision Studio</Text>
          <Text style={styles.title}>Bring the choice you keep circling</Text>
          <Text style={styles.subtitle}>
            Timing, pattern memory, emotional truth, and your chart are weighed before reflecting your clearest next move.
          </Text>
        </GlassPanel>

        <GlassPanel style={styles.signalStrip}>
          <View style={styles.signalRow}>
            <Text style={styles.signalLabel}>Lens</Text>
            <Text style={styles.signalValue}>Timing + memory + emotional truth</Text>
          </View>
          <View style={styles.signalRow}>
            <Text style={styles.signalLabel}>Mode</Text>
            <Text style={styles.signalValue}>Reflection, not command</Text>
          </View>
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>What decision are you facing?</Text>
          <GlassInput
            value={title}
            onChangeText={setTitle}
            placeholder="Should I stay, leave, launch, or wait?"
          />
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>What is happening around this?</Text>
          <GlassInput
            value={situation}
            onChangeText={setSituation}
            placeholder="Give the emotional and practical situation."
            multiline
            style={styles.largeInput}
          />
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>What are your real options?</Text>
          <GlassInput value={optionA} onChangeText={setOptionA} placeholder="Option 1" />
          <GlassInput value={optionB} onChangeText={setOptionB} placeholder="Option 2" />
          <GlassInput value={optionC} onChangeText={setOptionC} placeholder="Optional third option" />
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>What outcome do you want most?</Text>
          <GlassInput
            value={desiredOutcome}
            onChangeText={setDesiredOutcome}
            placeholder="Peace, momentum, certainty, relief..."
            multiline
            style={styles.mediumInput}
          />
          <Text style={styles.label}>What are you afraid might happen?</Text>
          <GlassInput
            value={biggestFear}
            onChangeText={setBiggestFear}
            placeholder="Name the cost, fear, or consequence."
            multiline
            style={styles.mediumInput}
          />
        </GlassPanel>

        <GlassPanel style={styles.panel}>
          <Text style={styles.label}>How urgent does this feel?</Text>
          <UrgencyChips value={urgency} onChange={setUrgency} />
        </GlassPanel>

        <GlassButton
          label={isLoading ? "Reading this now..." : "Analyze With Rah"}
          onPress={handleAnalyze}
        />

        {isLoading ? (
          <GlassPanel style={styles.resultPanel}>
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.text} />
              <Text style={styles.resultText}>Weighing timing, memory, and your deeper pattern.</Text>
            </View>
          </GlassPanel>
        ) : null}

        {result ? (
          <GlassPanel style={styles.resultPanel}>
            <Text style={styles.resultEyebrow}>Read</Text>
            <Text style={styles.resultTitle}>The shape of this decision</Text>
            <Text style={styles.resultText}>{result.content}</Text>
          </GlassPanel>
        ) : null}

        {sections ? (
          <>
            <DecisionSectionCard
              eyebrow="Core Tension"
              title="What this is really about"
              content={sections.coreTension}
            />
            <DecisionSectionCard
              eyebrow="Supports Action"
              title="What gives movement permission"
              content={sections.supportsAction}
            />
            <DecisionSectionCard
              eyebrow="Suggests Waiting"
              title="What asks for patience"
              content={sections.suggestsWaiting}
            />
            <DecisionSectionCard
              eyebrow="Blind Spot"
              title="What to notice next"
              content={sections.blindSpot}
            />
            <DecisionSectionCard
              eyebrow="Next Move"
              title="The most aligned next step"
              content={sections.nextMove}
            />
          </>
        ) : null}

        {latestDecision ? (
          <GlassPanel style={styles.resultPanel}>
            <Text style={styles.resultEyebrow}>Held Memory</Text>
            <Text style={styles.resultTitle}>Latest decision in memory</Text>
            <Text style={styles.memoryTitle}>{latestDecision.title}</Text>
            <Text style={styles.resultText}>{latestDecision.latestInsight || latestDecision.situation}</Text>
            {latestDecision.outcomeLoggedAt ? (
              <Text style={styles.chipHint}>
                Outcome logged: {latestDecision.outcomeSummary || "What happened next has been stored."}
              </Text>
            ) : null}
          </GlassPanel>
        ) : null}

        {decisionNeedingOutcome ? (
          <GlassPanel style={styles.panel}>
            <Text style={styles.resultEyebrow}>Decision Check-In</Text>
            <Text style={styles.resultTitle}>What actually happened after {decisionNeedingOutcome.title.toLowerCase()}?</Text>
            <GlassInput
              value={chosenOption}
              onChangeText={setChosenOption}
              placeholder="What did you choose?"
            />
            <GlassInput
              value={outcomeSummary}
              onChangeText={setOutcomeSummary}
              placeholder="What happened after that choice?"
              multiline
              style={styles.mediumInput}
            />
            <GlassInput
              value={emotionalOutcome}
              onChangeText={setEmotionalOutcome}
              placeholder="How did it feel emotionally?"
              multiline
              style={styles.mediumInput}
            />
            <Text style={styles.label}>Would you choose it again?</Text>
            <View style={styles.chipsWrap}>
              {(["yes", "no", "unsure"] as const).map((option) => {
                const active = wouldChooseAgain === option;
                return (
                  <Pressable key={option} onPress={() => setWouldChooseAgain(option)}>
                    <GlassPanel style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {option === "yes" ? "Yes" : option === "no" ? "No" : "Unsure"}
                      </Text>
                    </GlassPanel>
                  </Pressable>
                );
              })}
            </View>
            <GlassButton
              label={isLoggingOutcome ? "Logging outcome..." : "Log Outcome With Rah"}
              onPress={handleLogOutcome}
            />
          </GlassPanel>
        ) : null}
      </AtmosphericScrollView>
    </RahAppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  heroGlow: {
    position: "absolute",
    top: 12,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(163,139,255,0.14)",
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
  },
  kicker: {
    color: theme.colors.accentWarm,
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
    lineHeight: 22,
  },
  signalStrip: {
    gap: theme.spacing.sm,
  },
  signalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  signalLabel: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  signalValue: {
    color: theme.colors.text,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  panel: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  largeInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediumInput: {
    minHeight: 96,
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
    minWidth: 170,
    gap: 6,
  },
  chipActive: {
    backgroundColor: "rgba(107,124,255,0.24)",
    borderColor: "rgba(163,139,255,0.82)",
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.colors.text,
  },
  chipHint: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  chipHintActive: {
    color: theme.colors.textMuted,
  },
  resultPanel: {
    gap: theme.spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  resultEyebrow: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  resultText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  memoryTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
