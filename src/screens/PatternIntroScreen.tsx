import { StyleSheet, Text, View } from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useCurrentContext, useUser } from "@/context";
import { enterRahSurface } from "@/navigation/rahNavigation";

export function PatternIntroScreen() {
  const { currentContext } = useCurrentContext();
  const { updateUser } = useUser();

  const handleEnter = async () => {
    await updateUser({
      onboardingCompleted: true,
      chartRevealed: true,
    });
    enterRahSurface("/home");
  };

  return (
    <GlassContainer>
      <View style={styles.wrapper}>
        <OnboardingProgress stageLabel="Patterns" currentStep={8} totalSteps={8} />
        <View style={styles.stage}>
          <GlassPanel style={styles.card}>
            <Text style={styles.copy}>
              {currentContext?.repeatingPattern
                ? `${currentContext.repeatingPattern}. This pattern will become clearer as you reflect daily.`
                : "You tend to overthink when clarity is missing. This pattern will become clearer as you reflect daily."}
            </Text>
            <Text style={styles.subtext}>We'll track this together.</Text>
          </GlassPanel>
          <GlassButton label="Enter Rah" onPress={handleEnter} />
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 20,
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  card: {
    gap: 16,
  },
  copy: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
  },
  subtext: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
