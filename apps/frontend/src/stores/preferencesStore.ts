import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  language: "en" | "fr";
  theme: "system" | "dark" | "light";
  setLanguage: (language: "en" | "fr") => void;
  setTheme: (theme: "system" | "dark" | "light") => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "en",
      theme: "system",
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "wp-pilot-preferences",
    }
  )
);
