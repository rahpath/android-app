import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type PlacementPillProps = {
  label: string;
  value: string;
  accent?: string;
};

export function PlacementPill({
  label,
  value,
  accent = "rgba(163,139,255,0.22)",
}: PlacementPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: accent }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexBasis: "48%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: 2,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
