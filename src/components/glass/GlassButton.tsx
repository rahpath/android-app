import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
} from "react-native";

import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

type GlassButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
};

export function GlassButton({ label, onPress }: GlassButtonProps) {
  const { resolvedMode, colors } = useAppTheme();

  const gradientColors: readonly [string, string] =
    resolvedMode === "light"
      ? ["rgba(131,152,255,0.95)", "rgba(189,171,255,0.95)"]
      : ["#6E4BFF", "#A170FF"];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, resolvedMode === "light" && styles.gradientLight]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.pill,
    overflow: "hidden",
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  gradient: {
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  gradientLight: {
    borderColor: "rgba(255,255,255,0.58)",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
