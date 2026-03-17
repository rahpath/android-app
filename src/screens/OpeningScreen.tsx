import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import { enterRahSurface } from "@/navigation/rahNavigation";
import { storageAdapter } from "@/storage/storageAdapter";
import { theme } from "@/theme/theme";

export function OpeningScreen() {
  const { user, refreshUser } = useUser();
  const { refreshCurrentContext } = useCurrentContext();
  const { refreshMemoryEvents } = useMemory();
  const { refreshDecisions } = useDecision();
  const { refreshInsights } = useInsights();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const hasSkyProfile = Boolean(user?.birthDate && user.birthLocation);
  const shouldEnterHome = Boolean(user?.onboardingCompleted);
  const nextRoute = shouldEnterHome
    ? "/home"
    : hasSkyProfile
      ? "/chart-reveal"
      : "/profile-setup";

  const handleResetDemo = async () => {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    setResetMessage("Resetting demo data...");

    await storageAdapter.resetAppData();
    await Promise.all([
      refreshUser(),
      refreshCurrentContext(),
      refreshMemoryEvents(),
      refreshDecisions(),
      refreshInsights(),
    ]);

    setResetMessage("Demo reset complete. Starting from Sky Setup.");
    setIsResetting(false);
    router.replace("/profile-setup");
  };

  return (
    <GlassContainer>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Meet Rah</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.description}>
            A personal intelligence system{"\n"}for understanding your life.
          </Text>
        </GlassCard>

        <GlassButton
          label={shouldEnterHome ? "Enter Rah" : hasSkyProfile ? "Continue Setup" : "Map Your Sky"}
          onPress={() => (shouldEnterHome ? enterRahSurface("/home") : router.push(nextRoute))}
        />

        <Pressable onPress={handleResetDemo}>
          <Text style={styles.resetText}>{isResetting ? "Resetting..." : "Reset demo data"}</Text>
        </Pressable>

        {resetMessage ? <Text style={styles.resetStatus}>{resetMessage}</Text> : null}
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h1,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: theme.colors.glow,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  card: {
    marginHorizontal: theme.spacing.sm,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
    textAlign: "center",
  },
  resetText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    textAlign: "center",
    fontWeight: "700",
  },
  resetStatus: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textAlign: "center",
    lineHeight: 20,
  },
});
