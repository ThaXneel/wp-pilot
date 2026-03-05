"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSiteStore, Site } from "@/stores/siteStore";
import { useAuthStore } from "@/stores/authStore";

interface SitesResponse {
  id: string;
  name: string;
  wpUrl: string;
  status: "ONLINE" | "OFFLINE" | "PENDING";
  healthScore: number;
}

/**
 * Fetches the sites list independently of the dashboard page
 * and keeps the siteStore always populated.
 * Mount this inside the QueryClientProvider at the app layout level.
 */
export function SitesProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSites = useSiteStore((s) => s.setSites);

  const { data } = useQuery({
    queryKey: ["sites-list"],
    queryFn: async () => {
      const res = await api<SitesResponse[]>("/sites");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setSites(data as Site[]);
    }
  }, [data, setSites]);

  return <>{children}</>;
}
