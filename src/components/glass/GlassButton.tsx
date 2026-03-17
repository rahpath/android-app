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
      : ["rgba(107,124,255,0.95)", "rgba(163,139,255,0.95)"];

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
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  gradientLight: {
    borderColor: "rgba(255,255,255,0.58)",
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
