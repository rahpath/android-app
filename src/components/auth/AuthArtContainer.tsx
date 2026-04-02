import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, type ViewProps } from "react-native";

import { ArchiveIllustrationBackground } from "@/components/auth/ArchiveIllustrationBackground";

export function AuthArtContainer({ children, style }: ViewProps) {
  return (
    <View style={styles.root}>
      <ArchiveIllustrationBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.inner, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ece9e4",
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
  },
});
