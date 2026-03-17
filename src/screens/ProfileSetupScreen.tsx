import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useUser } from "@/context";
import { theme } from "@/theme/theme";

export function ProfileSetupScreen() {
  const { user, updateUser } = useUser();
  const [name, setName] = useState("Aryan");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "Aryan");
    setBirthDate(user.birthDate || "");
    setBirthTime(user.birthTime || "");
    setBirthLocation(user.birthLocation || "");
  }, [user]);

  const canContinue = Boolean(name.trim() && birthDate.trim() && birthLocation.trim());

  const handleContinue = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    setIsSaving(true);
    await updateUser({
      name: name.trim(),
      birthDate: birthDate.trim(),
      birthTime: birthTime.trim(),
      birthLocation: birthLocation.trim(),
      chartRevealed: false,
      onboardingCompleted: false,
    });
    setIsSaving(false);
    router.push("/chart-reveal");
  };

  return (
    <GlassContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <OnboardingProgress stageLabel="Sky" currentStep={1} totalSteps={4} />
          <GlassPanel style={styles.hero}>
            <Text style={styles.kicker}>Sky Setup</Text>
            <Text style={styles.title}>Map the sky you were born under</Text>
            <Text style={styles.subtitle}>
              Your birth details are profile data, not journal entries. They are stored directly so astrology feels real from the start.
            </Text>
          </GlassPanel>

          <GlassPanel style={styles.form}>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
            />
            <GlassInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="Birth date (YYYY-MM-DD)"
            />
            <GlassInput
              value={birthTime}
              onChangeText={setBirthTime}
              placeholder="Birth time (optional, HH:MM)"
            />
            <GlassInput
              value={birthLocation}
              onChangeText={setBirthLocation}
              placeholder="Birth city"
            />
            <View style={styles.noteWrap}>
              <Text style={styles.note}>
                Birth time is optional. If you skip it, sign placements still work, but rising sign and houses are held back for honesty.
              </Text>
            </View>
            <GlassButton
              label={isSaving ? "Saving..." : "Save Sky Profile"}
              onPress={handleContinue}
            />
          </GlassPanel>
        </AtmosphericScrollView>
      </KeyboardAvoidingView>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  form: {
    gap: theme.spacing.sm,
  },
  noteWrap: {
    marginTop: theme.spacing.xs,
  },
  note: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    lineHeight: 20,
  },
});
