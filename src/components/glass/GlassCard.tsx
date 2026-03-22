import { BlurView } from "expo-blur";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

type GlassCardProps = ViewProps & {
  intensity?: number;
};

export function GlassCard({
  children,
  style,
  intensity = 42,
  ...rest
}: GlassCardProps) {
  const { resolvedMode, colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: resolvedMode === "light" ? "rgba(255,255,255,0.48)" : "rgba(190,166,255,0.16)",
          backgroundColor: resolvedMode === "light" ? "rgba(255,255,255,0.22)" : "rgba(18,18,26,0.72)",
          shadowColor: colors.glow,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView intensity={intensity} tint={resolvedMode === "light" ? "light" : "dark"} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  content: {
    padding: 18,
  },
});
