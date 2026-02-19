"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import { Spinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "OWNER" | "CLIENT";
}

function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard
      if (user?.role === "OWNER") {
        router.push(`/${locale}/admin/dashboard`);
      } else {
        router.push(`/${locale}/app/dashboard`);
      }
    }
  }, [isAuthenticated, user, requiredRole, router, locale]);

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

export { AuthGuard };
