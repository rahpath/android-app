import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthArtContainer } from "@/components/auth/AuthArtContainer";
import { useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import { enterRahSurface } from "@/navigation/rahNavigation";
import { storageAdapter } from "@/storage/storageAdapter";

export function OpeningScreen() {
  const { user, refreshUser } = useUser();
  const { refreshCurrentContext } = useCurrentContext();
  const { refreshMemoryEvents } = useMemory();
  const { refreshDecisions } = useDecision();
  const { refreshInsights } = useInsights();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const entrance = useRef(new Animated.Value(0)).current;

  const hasSkyProfile = Boolean(user?.birthDate && user.birthLocation);
  const shouldEnterHome = Boolean(user?.onboardingCompleted);
  const nextRoute = shouldEnterHome
    ? "/home"
    : hasSkyProfile
      ? "/chart-reveal"
      : "/profile-setup";

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const handlePrimary = () => {
    if (shouldEnterHome) {
      enterRahSurface("/home");
      return;
    }

    router.push(nextRoute);
  };

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

    setResetMessage("Demo reset complete. Starting from account setup.");
    setIsResetting(false);
    router.replace("/profile-setup");
  };

  return (
    <AuthArtContainer>
      <Animated.View
        style={[
          styles.screen,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>RAH</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>EMAIL / USERNAME</Text>
            <View style={styles.fieldShell}>
              <TextInput
                value={identity}
                onChangeText={setIdentity}
                placeholder="Enter your archive identity"
                placeholderTextColor="#a9a69d"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.fieldShell}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="........"
                placeholderTextColor="#a9a69d"
                style={styles.input}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handlePrimary}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/profile-setup")}>
            <Text style={styles.secondaryAction}>Create Account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.helpText}>? HELP</Text>
          <Pressable onPress={handleResetDemo}>
            <Text style={styles.resetText}>{isResetting ? "Resetting..." : "Reset Demo"}</Text>
          </Pressable>
          {resetMessage ? <Text style={styles.resetMessage}>{resetMessage}</Text> : null}
        </View>
      </Animated.View>
    </AuthArtContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 14,
  },
  brandBlock: {
    alignItems: "center",
    marginTop: 10,
  },
  brand: {
    color: "#fffdf8",
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: 5,
    textShadowColor: "rgba(17, 43, 74, 0.26)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  card: {
    marginHorizontal: 6,
    marginTop: 96,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
    borderRadius: 18,
    backgroundColor: "rgba(248, 244, 237, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    shadowColor: "rgba(47, 73, 98, 0.28)",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    gap: 24,
  },
  formGroup: {
    gap: 10,
  },
  fieldLabel: {
    color: "#5f6e77",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  fieldShell: {
    minHeight: 56,
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(228, 223, 214, 0.95)",
    paddingHorizontal: 14,
  },
  input: {
    color: "#6e716d",
    fontSize: 15,
    fontWeight: "500",
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#123765",
    shadowColor: "rgba(18, 55, 101, 0.38)",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryButtonText: {
    color: "#f8f3eb",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  secondaryAction: {
    color: "#3d4f69",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },
  footer: {
    alignItems: "center",
    gap: 8,
  },
  helpText: {
    color: "#f7f2e6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  resetText: {
    color: "#f7f2e6",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.92,
  },
  resetMessage: {
    color: "#fbf8f0",
    fontSize: 11,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 16,
  },
});
