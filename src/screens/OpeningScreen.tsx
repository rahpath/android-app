import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { useCurrentContext, useDecision, useInsights, useMemory, useUser } from "@/context";
import { enterRahSurface } from "@/navigation/rahNavigation";
import { storageAdapter } from "@/storage/storageAdapter";
import { theme } from "@/theme/theme";

const { width } = Dimensions.get("window");

const VALUE_CARDS = [
  { icon: "•", title: "Track your thoughts" },
  { icon: "◦", title: "See your patterns" },
  { icon: "✦", title: "Gain daily clarity" },
] as const;

export function OpeningScreen() {
  const { user, refreshUser } = useUser();
  const { refreshCurrentContext } = useCurrentContext();
  const { refreshMemoryEvents } = useMemory();
  const { refreshDecisions } = useDecision();
  const { refreshInsights } = useInsights();
  const [stage, setStage] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const entrance = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);

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
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [entrance, stage]);

  const handleStart = () => {
    if (shouldEnterHome || hasSkyProfile) {
      if (shouldEnterHome) {
        enterRahSurface("/home");
        return;
      }
      router.push(nextRoute);
      return;
    }

    setStage(1);
  };

  const handleContinue = () => {
    router.push(nextRoute);
  };

  const handleCardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    setActiveCard(Math.max(0, Math.min(VALUE_CARDS.length - 1, nextIndex)));
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

    setResetMessage("Demo reset complete. Starting from Sky Setup.");
    setIsResetting(false);
    setStage(0);
    router.replace("/profile-setup");
  };

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
    ],
  };

  return (
    <GlassContainer>
      <View style={styles.wrapper}>
        {stage === 0 ? (
          <Animated.View style={[styles.stage, styles.centerStage, animatedStyle]}>
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>RAH</Text>
              <Text style={styles.brandSub}>Calm intelligence for real life</Text>
            </View>

            <View style={styles.copyWrap}>
              <Text style={styles.title}>
                You've lived every day of your life...
                {"\n"}
                but how much of it do you understand?
              </Text>
              <Text style={styles.subtitle}>
                A quieter way to notice patterns, timing, and what your life is asking for.
              </Text>
            </View>

            <View style={styles.footer}>
              <GlassButton
                label={shouldEnterHome ? "Enter" : hasSkyProfile ? "Continue" : "Start"}
                onPress={handleStart}
              />
              <Pressable onPress={handleResetDemo}>
                <Text style={styles.resetText}>{isResetting ? "Resetting..." : "Reset demo data"}</Text>
              </Pressable>
              {resetMessage ? <Text style={styles.resetStatus}>{resetMessage}</Text> : null}
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.stage, animatedStyle]}>
            <View style={styles.cardsHeader}>
              <Text style={styles.cardsLabel}>What Rah helps you do</Text>
              <Text style={styles.cardsTitle}>A calm system for reflection</Text>
            </View>

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCardScroll}
              contentContainerStyle={styles.cardsTrack}
            >
              {VALUE_CARDS.map((card) => (
                <GlassCard key={card.title} style={styles.valueCard}>
                  <Text style={styles.valueIcon}>{card.icon}</Text>
                  <Text style={styles.valueTitle}>{card.title}</Text>
                </GlassCard>
              ))}
            </ScrollView>

            <View style={styles.pagination}>
              {VALUE_CARDS.map((card, index) => (
                <Pressable
                  key={card.title}
                  onPress={() => {
                    scrollRef.current?.scrollTo({ x: index * (width - 40), animated: true });
                    setActiveCard(index);
                  }}
                  style={[styles.dot, activeCard === index && styles.dotActive]}
                />
              ))}
            </View>

            <View style={styles.footer}>
              <GlassButton label="Continue" onPress={handleContinue} />
            </View>
          </Animated.View>
        )}
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  centerStage: {
    justifyContent: "space-between",
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  brandWrap: {
    gap: 8,
  },
  brand: {
    color: theme.colors.textSoft,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 4,
  },
  brandSub: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    letterSpacing: 0.6,
  },
  copyWrap: {
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: "800",
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
    maxWidth: 320,
  },
  cardsHeader: {
    gap: 8,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  cardsLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  cardsTitle: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  cardsTrack: {
    alignItems: "stretch",
  },
  valueCard: {
    width: width - 40,
    minHeight: 320,
    justifyContent: "flex-end",
    marginRight: 16,
    paddingBottom: 28,
  },
  valueIcon: {
    color: theme.colors.secondary,
    fontSize: 36,
    marginBottom: 18,
  },
  valueTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: -0.6,
    maxWidth: 180,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dotActive: {
    width: 26,
    backgroundColor: theme.colors.secondary,
  },
  footer: {
    gap: theme.spacing.sm,
    marginTop: "auto",
    paddingBottom: theme.spacing.sm,
  },
  resetText: {
    color: theme.colors.textSoft,
    fontSize: theme.typography.caption,
    textAlign: "center",
    fontWeight: "700",
  },
  resetStatus: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textAlign: "center",
    lineHeight: 18,
  },
});
