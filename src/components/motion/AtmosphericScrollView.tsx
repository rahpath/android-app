import { useMemo, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";

import { useAppTheme } from "@/theme/AppThemeProvider";

type AtmosphericScrollViewProps = ScrollViewProps & {
  revealOffset?: number;
};

export function AtmosphericScrollView({
  children,
  revealOffset = 46,
  contentContainerStyle,
  ...rest
}: AtmosphericScrollViewProps) {
  const { colors } = useAppTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const mappedChildren = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.aura,
          {
            backgroundColor: colors.glowSoft,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 800],
                  outputRange: [0, -60],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      />
      <Animated.ScrollView
        {...rest}
        contentContainerStyle={contentContainerStyle}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {mappedChildren.map((child, index) => {
          const start = index * revealOffset;
          return (
            <Animated.View
              key={`atmos-child-${index}`}
              style={{
                opacity: scrollY.interpolate({
                  inputRange: [start - 180, start - 30, start + 80],
                  outputRange: [0.52, 1, 1],
                  extrapolate: "clamp",
                }),
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [start - 180, start - 20, start + 120],
                      outputRange: [22, 0, 0],
                      extrapolate: "clamp",
                    }),
                  },
                  {
                    scale: scrollY.interpolate({
                      inputRange: [start - 180, start - 20, start + 120],
                      outputRange: [0.985, 1, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              }}
            >
              {child}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  aura: {
    position: "absolute",
    top: -30,
    left: 18,
    right: 18,
    height: 120,
    borderRadius: 120,
    opacity: 0.22,
  },
});
