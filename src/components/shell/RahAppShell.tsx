import type { ReactNode } from "react";
import { usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassContainer } from "@/components/glass/GlassContainer";
import { getRahShellActivePath, navigateWithinRah, type RahShellPath } from "@/navigation/rahNavigation";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

const SHELL_ITEMS: Array<{ path: RahShellPath; label: string }> = [
  { path: "/home", label: "Home" },
  { path: "/journey", label: "Reflect" },
  { path: "/ask", label: "Chat" },
  { path: "/decision", label: "Pattern" },
  { path: "/chart", label: "Profile" },
];

export function RahAppShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath?: RahShellPath;
}) {
  const { colors, mode, resolvedMode, cycleMode } = useAppTheme();
  const pathname = usePathname();
  const resolvedActivePath = activePath ?? getRahShellActivePath(pathname);

  return (
    <GlassContainer>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brandTitle, { color: colors.text }]}>RAH</Text>
            <Text style={[styles.brandSub, { color: colors.textSoft }]}>Path Intelligence</Text>
          </View>
          <Pressable
            onPress={cycleMode}
            style={[
              styles.modePill,
              { borderColor: colors.glassBorder, backgroundColor: colors.glassFill },
            ]}
          >
            <Text style={[styles.modeText, { color: colors.text }]}>
              {mode === "system" ? "Auto" : resolvedMode === "light" ? "Light" : "Dark"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.content}>{children}</View>
        <View style={styles.navWrap}>
          <View style={[styles.navGlow, { backgroundColor: colors.glowSoft }]} />
          <View
            style={[
              styles.navBar,
              {
                borderColor: colors.glassBorder,
                backgroundColor: "rgba(247,243,236,0.92)",
              },
            ]}
          >
            {SHELL_ITEMS.map((item) => {
              const isActive = item.path === resolvedActivePath;

              return (
                <Pressable
                  key={item.path}
                  onPress={() => navigateWithinRah(item.path, pathname)}
                  style={[
                    styles.navItem,
                    isActive && {
                      backgroundColor: "rgba(18,55,101,0.1)",
                      borderWidth: 1,
                      borderColor: "rgba(18,55,101,0.16)",
                    },
                  ]}
                >
                  <Text style={[styles.navLabel, { color: isActive ? colors.text : colors.textMuted }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 12,
  },
  brandBlock: {
    gap: 2,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 3.2,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  modePill: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  content: {
    flex: 1,
  },
  navWrap: {
    paddingTop: theme.spacing.sm,
    paddingBottom: 2,
  },
  navGlow: {
    position: "absolute",
    top: 6,
    left: theme.spacing.md,
    right: theme.spacing.md,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(93,120,143,0.08)",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(247,243,236,0.9)",
    overflow: "hidden",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0,
    flexShrink: 1,
    textAlign: "center",
  },
});
