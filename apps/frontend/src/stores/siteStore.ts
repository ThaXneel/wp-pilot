import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Site {
  id: string;
  name: string;
  wpUrl: string;
  status: "ONLINE" | "OFFLINE" | "PENDING";
  healthScore: number;
}

interface SiteState {
  sites: Site[];
  selectedSiteId: string | null;
  sidebarCollapsed: boolean;
  setSites: (sites: Site[]) => void;
  selectSite: (siteId: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      sites: [],
      selectedSiteId: null,
      sidebarCollapsed: false,

      setSites: (sites) => {
        const current = get().selectedSiteId;
        const stillExists = sites.some((s) => s.id === current);
        set({
          sites,
          selectedSiteId: stillExists ? current : sites[0]?.id ?? null,
        });
      },

      selectSite: (siteId) => set({ selectedSiteId: siteId }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "wp-pilot-site",
      partialize: (state) => ({
        selectedSiteId: state.selectedSiteId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
