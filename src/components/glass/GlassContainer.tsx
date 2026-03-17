import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, type ViewProps } from "react-native";

import { MysticBackground } from "@/components/motion/MysticBackground";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

export function GlassContainer({ children, style }: ViewProps) {
  const { colors } = useAppTheme();

  return (
    <LinearGradient
      colors={[colors.backgroundStart, colors.backgroundEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <MysticBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.inner, style]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
});
