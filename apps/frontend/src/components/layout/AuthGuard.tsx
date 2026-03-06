"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "OWNER" | "CLIENT";
}

function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, user, refreshToken, login, logout } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const [hydrated, setHydrated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Wait for Zustand persist to finish rehydrating from storage
  useEffect(() => {
    // If already hydrated (sync storage), set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    // Otherwise wait for the async hydration to finish
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  // Once hydrated, decide: authenticated, needs refresh, or redirect to login
  useEffect(() => {
    if (!hydrated) return;

    async function check() {
      const state = useAuthStore.getState();

      if (state.isAuthenticated && state.accessToken) {
        // Already authenticated — nothing to do
        setChecking(false);
        return;
      }

      // Not authenticated but have a refresh token — try silent refresh
      if (state.refreshToken) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: state.refreshToken }),
            },
          );

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data && state.user) {
              // We have persisted user + fresh tokens — restore the session
              login(
                state.user,
                data.data.accessToken,
                data.data.refreshToken,
                data.data.rememberMe ?? state.rememberMe,
              );
              setChecking(false);
              return;
            }
          }
        } catch {
          // Refresh failed — fall through to logout
        }
      }

      // No valid session — redirect to login
      logout();
      router.push(`/${locale}/login`);
      setChecking(false);
    }

    check();
  }, [hydrated, locale, login, logout, router]);

  // After auth is confirmed, handle role-based redirects
  useEffect(() => {
    if (!hydrated || checking || !isAuthenticated) return;

    if (requiredRole && user?.role !== requiredRole) {
      if (user?.role === "OWNER") {
        router.push(`/${locale}/admin/dashboard`);
      } else {
        router.push(`/${locale}/app/dashboard`);
      }
    }
  }, [hydrated, checking, isAuthenticated, user, requiredRole, router, locale]);

  if (!hydrated || checking || !isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

export { AuthGuard };
