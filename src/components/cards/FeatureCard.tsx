import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/glass/GlassCard";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

type FeatureCardProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function FeatureCard({ title, subtitle, onPress }: FeatureCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard style={styles.card}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.sm,
  },
  content: {
    minHeight: 78,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: theme.typography.caption,
  },
  pressed: {
    opacity: 0.9,
  },
});
