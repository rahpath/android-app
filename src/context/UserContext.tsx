import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { storageAdapter } from "@/storage/storageAdapter";
import type { UserProfile } from "@/types/domain";

type UserContextValue = {
  isLoading: boolean;
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const profile = await storageAdapter.getUserProfile();
    setUser(profile);
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    const current = user ?? (await storageAdapter.getUserProfile());
    const nextUser = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUser(nextUser);
    await storageAdapter.saveUserProfile(nextUser);
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  return (
    <UserContext.Provider
      value={{
        isLoading,
        user,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
