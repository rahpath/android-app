import { StyleSheet, Text } from "react-native";

import { GlassPanel } from "@/components/glass/GlassPanel";
import { theme } from "@/theme/theme";

export function AstrologyMeaningCard({
  eyebrow,
  title,
  content,
}: {
  eyebrow: string;
  title: string;
  content: string;
}) {
  return (
    <GlassPanel style={styles.panel}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  content: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
});
