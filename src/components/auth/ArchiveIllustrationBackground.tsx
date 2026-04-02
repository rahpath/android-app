import { ImageBackground, StyleSheet, View } from "react-native";

export function ArchiveIllustrationBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground
        source={require("../../../assets/archive-ocean-bg.jpeg")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.wash} />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 239, 230, 0.18)",
  },
});
