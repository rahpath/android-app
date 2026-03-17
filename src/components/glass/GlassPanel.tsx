import { StyleSheet, type ViewProps } from "react-native";

import { GlassCard } from "@/components/glass/GlassCard";
import { theme } from "@/theme/theme";

export function GlassPanel({ children, style, ...rest }: ViewProps) {
  return (
    <GlassCard style={[styles.panel, style]} {...rest}>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: theme.spacing.md,
  },
});
