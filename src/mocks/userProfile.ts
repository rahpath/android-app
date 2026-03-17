import type { UserProfile } from "@/types/domain";

export const defaultUserProfile: UserProfile = {
  id: "aryan",
  name: "Aryan",
  birthDate: "",
  birthTime: "",
  birthLocation: "",
  onboardingCompleted: false,
  chartRevealed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
