import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  role: "OWNER" | "CLIENT";
  languagePreference: string;
  themePreference: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
}

/**
 * Module-level flag tracks which storage is active.
 * Initialized from existing persisted data, then updated by login/logout.
 */
let useLocalStorage = false;
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("obmat-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.rememberMe) {
        useLocalStorage = true;
      }
    }
  } catch {
    // ignore parse errors
  }
}

const authStorage = createJSONStorage(() => {
  if (typeof window === "undefined") return sessionStorage;
  return useLocalStorage ? localStorage : sessionStorage;
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      rememberMe: false,

      login: (user, accessToken, refreshToken, rememberMe = false) => {
        // Update the module-level flag BEFORE the set() triggers a write
        useLocalStorage = rememberMe;

        // Clear the opposite storage
        if (rememberMe) {
          sessionStorage.removeItem("obmat-auth");
        } else {
          localStorage.removeItem("obmat-auth");
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true, rememberMe });
      },

      logout: () => {
        // Clear both storages
        localStorage.removeItem("obmat-auth");
        sessionStorage.removeItem("obmat-auth");
        useLocalStorage = false;
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, rememberMe: false });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) =>
        set({ user }),
    }),
    {
      name: "obmat-auth",
      storage: authStorage,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    }
  )
);
