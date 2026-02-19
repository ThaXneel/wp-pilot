"use client";

import { AuthGuard } from "@/components/layout/AuthGuard";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  }));

  return (
    <AuthGuard requiredRole="CLIENT">
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen bg-(--color-background)">
          <ClientSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </QueryClientProvider>
    </AuthGuard>
  );
}
