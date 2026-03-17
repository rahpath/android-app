import { StyleSheet, Text, View } from "react-native";

import { GlassPanel } from "@/components/glass/GlassPanel";
import { theme } from "@/theme/theme";

export function DecisionSectionCard({
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
      <View style={styles.divider} />
      <Text style={styles.content}>{content}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: theme.spacing.sm,
    borderColor: "rgba(255,255,255,0.18)",
  },
  eyebrow: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
});
