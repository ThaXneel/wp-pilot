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

// Custom storage that delegates to localStorage or sessionStorage based on rememberMe
const authStorage = createJSONStorage<AuthState>(() => {
  if (typeof window === "undefined") return sessionStorage;
  // Check if user previously chose "remember me"
  const stored = localStorage.getItem("wp-pilot-auth");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.rememberMe) return localStorage;
    } catch {}
  }
  // Check sessionStorage as fallback
  const sessionStored = sessionStorage.getItem("wp-pilot-auth");
  if (sessionStored) return sessionStorage;
  return sessionStorage;
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
        // Clear the opposite storage when switching modes
        if (rememberMe) {
          sessionStorage.removeItem("wp-pilot-auth");
        } else {
          localStorage.removeItem("wp-pilot-auth");
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true, rememberMe });
      },

      logout: () => {
        // Clear both storages on logout
        localStorage.removeItem("wp-pilot-auth");
        sessionStorage.removeItem("wp-pilot-auth");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, rememberMe: false });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) =>
        set({ user }),
    }),
    {
      name: "wp-pilot-auth",
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
