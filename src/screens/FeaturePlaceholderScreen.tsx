import { StyleSheet, Text, View } from "react-native";

import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { theme } from "@/theme/theme";

type FeaturePlaceholderScreenProps = {
  title: string;
};

export function FeaturePlaceholderScreen({ title }: FeaturePlaceholderScreenProps) {
  return (
    <GlassContainer>
      <View style={styles.center}>
        <GlassPanel style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
        </GlassPanel>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
  },
  panel: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "700",
    textAlign: "center",
  },
});
