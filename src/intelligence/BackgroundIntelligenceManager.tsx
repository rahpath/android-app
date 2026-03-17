import { useEffect, useRef } from "react";

import { useAstrology, useCurrentContext, useUser } from "@/context";
import { useRahEngine } from "@/intelligence/rahEngine";

export function BackgroundIntelligenceManager() {
  const { user } = useUser();
  const { currentContext } = useCurrentContext();
  const { chartReady, hasBirthData } = useAstrology();
  const { generateHomeIntelligence } = useRahEngine();
  const lastRunSignature = useRef<string>("");
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!user?.onboardingCompleted || !currentContext?.setupCompleted || !hasBirthData || !chartReady) {
      return;
    }

    const signature = [
      user.updatedAt || user.createdAt,
      currentContext.updatedAt,
      new Date().toISOString().slice(0, 10),
      chartReady ? "chart-ready" : "chart-pending",
    ].join("|");

    if (signature === lastRunSignature.current || isRunningRef.current) {
      return;
    }

    lastRunSignature.current = signature;
    isRunningRef.current = true;

    generateHomeIntelligence().finally(() => {
      isRunningRef.current = false;
    });
  }, [
    chartReady,
    currentContext?.setupCompleted,
    currentContext?.updatedAt,
    generateHomeIntelligence,
    hasBirthData,
    user?.createdAt,
    user?.onboardingCompleted,
    user?.updatedAt,
  ]);

  return null;
}
