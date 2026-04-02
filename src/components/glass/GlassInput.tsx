import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { GlassCard } from "@/components/glass/GlassCard";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

export function GlassInput(props: TextInputProps) {
  const { colors } = useAppTheme();

  return (
    <GlassCard style={styles.wrapper}>
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }, props.style]}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 58,
    backgroundColor: "rgba(255,255,255,0.44)",
  },
  input: {
    fontSize: theme.typography.body,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: theme.spacing.sm,
  },
});
