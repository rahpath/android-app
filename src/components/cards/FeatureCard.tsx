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
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
            </View>
            <Text style={[styles.arrow, { color: colors.textSoft }]}>+</Text>
          </View>
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
    minHeight: 84,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 22,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.9,
  },
});
