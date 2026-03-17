import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AstrologyProvider } from "@/context/AstrologyContext";
import { ContextProvider } from "@/context/ContextContext";
import { DecisionProvider } from "@/context/DecisionContext";
import { InsightProvider } from "@/context/InsightContext";
import { MemoryProvider } from "@/context/MemoryContext";
import { UserProvider } from "@/context/UserContext";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { storageAdapter } from "@/storage/storageAdapter";
import { BackgroundIntelligenceManager } from "@/intelligence/BackgroundIntelligenceManager";
import { AppThemeProvider, useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

function AppProvidersInner({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    storageAdapter.initializeApp().finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return (
      <GlassContainer>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading Rah...</Text>
        </View>
      </GlassContainer>
    );
  }

  return (
    <UserProvider>
      <ContextProvider>
        <MemoryProvider>
          <DecisionProvider>
            <InsightProvider>
              <AstrologyProvider>
                <BackgroundIntelligenceManager />
                {children}
              </AstrologyProvider>
            </InsightProvider>
          </DecisionProvider>
        </MemoryProvider>
      </ContextProvider>
    </UserProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <AppProvidersInner>{children}</AppProvidersInner>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
  },
});
