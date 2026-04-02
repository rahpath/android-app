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
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.glassBorder,
          backgroundColor: colors.glassFill,
          shadowColor: colors.glow,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  content: {
    padding: 18,
  },
});
