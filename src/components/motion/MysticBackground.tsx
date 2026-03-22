import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { useAppTheme } from "@/theme/AppThemeProvider";

const { width, height } = Dimensions.get("window");

type StarNode = {
  id: string;
  x: number;
  y: number;
  r: number;
  opacity: number;
};

function createNodes(): StarNode[] {
  return [
    { id: "s1", x: width * 0.1, y: height * 0.18, r: 2.4, opacity: 0.34 },
    { id: "s2", x: width * 0.26, y: height * 0.12, r: 1.6, opacity: 0.4 },
    { id: "s3", x: width * 0.44, y: height * 0.2, r: 2.2, opacity: 0.46 },
    { id: "s4", x: width * 0.68, y: height * 0.15, r: 2.8, opacity: 0.42 },
    { id: "s5", x: width * 0.83, y: height * 0.24, r: 1.8, opacity: 0.32 },
    { id: "s6", x: width * 0.73, y: height * 0.58, r: 2.4, opacity: 0.36 },
    { id: "s7", x: width * 0.54, y: height * 0.66, r: 1.8, opacity: 0.32 },
    { id: "s8", x: width * 0.2, y: height * 0.72, r: 2.2, opacity: 0.3 },
  ];
}

export function MysticBackground() {
  const { resolvedMode, colors } = useAppTheme();
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const stars = useMemo(() => createNodes(), []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [drift, orbit, pulse]);

  const rotation = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const driftY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.orbLarge,
          {
            opacity: pulse,
            transform: [{ translateY: driftY }],
          },
        ]}
      >
        <LinearGradient
          colors={
            resolvedMode === "light"
              ? ["rgba(176,190,255,0.24)", "rgba(174,232,255,0.12)", "rgba(176,190,255,0.04)"]
              : ["rgba(124,92,255,0.24)", "rgba(94,58,181,0.10)", "rgba(124,92,255,0.02)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOrb}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orbitLayer,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <Svg width={width} height={height} style={styles.svg}>
          {stars.map((star) => (
            <Circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={resolvedMode === "light" ? `rgba(250,252,255,${Math.min(star.opacity + 0.1, 0.72)})` : `rgba(255,255,255,${star.opacity})`}
            />
          ))}
          <Line
            x1={stars[0].x}
            y1={stars[0].y}
            x2={stars[2].x}
            y2={stars[2].y}
            stroke={resolvedMode === "light" ? "rgba(255,255,255,0.16)" : "rgba(163,139,255,0.12)"}
            strokeWidth={1}
          />
          <Line
            x1={stars[2].x}
            y1={stars[2].y}
            x2={stars[3].x}
            y2={stars[3].y}
            stroke={resolvedMode === "light" ? "rgba(174,232,255,0.18)" : "rgba(161,126,255,0.10)"}
            strokeWidth={1}
          />
          <Line
            x1={stars[3].x}
            y1={stars[3].y}
            x2={stars[5].x}
            y2={stars[5].y}
            stroke={resolvedMode === "light" ? "rgba(255,255,255,0.14)" : "rgba(163,139,255,0.08)"}
            strokeWidth={1}
          />
          <Circle
            cx={width * 0.83}
            cy={height * 0.22}
            r={width * 0.18}
            stroke={resolvedMode === "light" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"}
            strokeWidth={1}
            fill={resolvedMode === "light" ? colors.glowSoft : "rgba(124,92,255,0.03)"}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orbLarge: {
    position: "absolute",
    top: -height * 0.06,
    right: -width * 0.2,
    width: width * 0.74,
    height: width * 0.74,
    borderRadius: width,
    overflow: "hidden",
  },
  gradientOrb: {
    flex: 1,
    borderRadius: width,
  },
  orbitLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  svg: {
    opacity: 0.95,
  },
});
