import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type SignalBadgeProps = {
  label: string;
  value: string;
};

export function SignalBadge({ label, value }: SignalBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexBasis: "48%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: 2,
  },
  label: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
