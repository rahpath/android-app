import type { ReactNode } from "react";
import { usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassContainer } from "@/components/glass/GlassContainer";
import { getRahShellActivePath, navigateWithinRah, type RahShellPath } from "@/navigation/rahNavigation";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { theme } from "@/theme/theme";

const SHELL_ITEMS: Array<{ path: RahShellPath; label: string; helper: string }> = [
  { path: "/home", label: "Home", helper: "Ritual" },
  { path: "/journey", label: "Reflect", helper: "Memory" },
  { path: "/ask", label: "Chat", helper: "Chat" },
  { path: "/decision", label: "Patterns", helper: "Choice" },
  { path: "/chart", label: "Profile", helper: "Sky" },
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
                backgroundColor: resolvedMode === "light" ? "rgba(59,76,120,0.78)" : "rgba(8,11,31,0.78)",
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
                      backgroundColor: resolvedMode === "light" ? "rgba(255,255,255,0.18)" : "rgba(107,124,255,0.18)",
                      borderWidth: 1,
                      borderColor: colors.secondary,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.navDot,
                      {
                        backgroundColor: isActive ? colors.accentWarm : "rgba(255,255,255,0.24)",
                      },
                    ]}
                  />
                  <Text style={[styles.navLabel, { color: isActive ? colors.text : colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.navHelper, { color: isActive ? colors.secondary : colors.textSoft }]}>{item.helper}</Text>
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.4,
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
    paddingBottom: theme.spacing.xs,
  },
  navGlow: {
    position: "absolute",
    top: 2,
    left: theme.spacing.md,
    right: theme.spacing.md,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(161,126,255,0.08)",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,11,31,0.78)",
    overflow: "hidden",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 62,
    borderRadius: theme.radius.md,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  navHelper: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
