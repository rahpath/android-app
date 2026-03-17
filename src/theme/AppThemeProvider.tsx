import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { darkColors, lightColors, type ThemeColors } from "@/theme/theme";

type ThemeMode = "dark" | "light" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "dark" | "light";
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const AppThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemMode = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  const resolvedMode: "dark" | "light" =
    mode === "system" ? (systemMode === "light" ? "light" : "dark") : mode;

  const colors: ThemeColors = resolvedMode === "light" ? lightColors : darkColors;

  const cycleMode = useCallback(() => {
    setMode((currentMode) => {
      if (currentMode === "system") {
        return "dark";
      }

      if (currentMode === "dark") {
        return "light";
      }

      return "system";
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      colors,
      setMode,
      cycleMode,
    }),
    [colors, cycleMode, mode, resolvedMode],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
