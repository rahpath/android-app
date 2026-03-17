import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useCurrentContext, useUser } from "@/context";
import { theme } from "@/theme/theme";

const LIFE_RATING_OPTIONS = ["Great", "Okay", "Messy", "Overwhelming"];
const LIFE_AREA_OPTIONS = ["Career", "Relationships", "Purpose", "Money", "Family", "Health"];
const PATTERN_OPTIONS = [
  "I overthink and delay",
  "I repeat intense dynamics",
  "I lose direction fast",
  "I compare myself too much",
  "I carry stress in my body",
];
const SUPPORT_OPTIONS = ["Clarity", "Calm", "Direction", "Validation"];

function OptionGroup({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipsWrap}>
        {options.map((option) => {
          const isActive = selectedValue === option;
          return (
            <Pressable key={option} onPress={() => onSelect(option)}>
              <GlassCard style={[styles.chip, isActive && styles.chipActive]}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option}</Text>
              </GlassCard>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ContextSetupScreen() {
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const { updateUser } = useUser();

  const canContinue = Boolean(
    currentContext?.activeIntent
      && currentContext.lifeRating
      && currentContext.mainLifeArea
      && currentContext.repeatingPattern
      && currentContext.supportNeed,
  );

  const handleContinue = async () => {
    if (!currentContext?.activeIntent || !canContinue) {
      return;
    }

    await updateUser({
      onboardingCompleted: false,
    });

    router.push("/context-deepen");
  };

  return (
    <GlassContainer>
      <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingProgress stageLabel="Context" currentStep={3} totalSteps={4} />

        <GlassPanel style={styles.hero}>
          <Text style={styles.kicker}>Current Context</Text>
          <Text style={styles.title}>Capture the present-day picture</Text>
          <Text style={styles.subtitle}>
            This structured context layer will flow into every future conversation, insight, and decision reflection.
          </Text>
        </GlassPanel>

        <OptionGroup
          title="How is life feeling lately?"
          options={LIFE_RATING_OPTIONS}
          selectedValue={currentContext?.lifeRating || ""}
          onSelect={(value) => updateCurrentContext({ lifeRating: value })}
        />

        <OptionGroup
          title="Which life area feels most charged?"
          options={LIFE_AREA_OPTIONS}
          selectedValue={currentContext?.mainLifeArea || ""}
          onSelect={(value) => updateCurrentContext({ mainLifeArea: value })}
        />

        <OptionGroup
          title="What pattern feels too familiar?"
          options={PATTERN_OPTIONS}
          selectedValue={currentContext?.repeatingPattern || ""}
          onSelect={(value) => updateCurrentContext({ repeatingPattern: value })}
        />

        <OptionGroup
          title="What would help most right now?"
          options={SUPPORT_OPTIONS}
          selectedValue={currentContext?.supportNeed || ""}
          onSelect={(value) => updateCurrentContext({ supportNeed: value })}
        />

        <View style={styles.group}>
          <Text style={styles.groupTitle}>One sentence on what's most real right now</Text>
          <GlassInput
            value={currentContext?.currentFocusSummary || ""}
            onChangeText={(value) => updateCurrentContext({ currentFocusSummary: value })}
            placeholder="A short honest sentence is enough"
            multiline
            textAlignVertical="top"
            style={styles.summaryInput}
          />
        </View>

        <GlassButton label="Go Deeper" onPress={handleContinue} />
      </AtmosphericScrollView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
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
  group: {
    gap: theme.spacing.sm,
  },
  groupTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
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
  summaryInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});
