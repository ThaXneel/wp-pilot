"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login: storeLogin } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      const res = await api<{
        user: {
          id: string;
          email: string;
          role: "OWNER" | "CLIENT";
          languagePreference: string;
          themePreference: string;
        };
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      storeLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push("/app/onboarding");
    } catch {
      setError(t("registerError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-background) px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="text-2xl font-bold text-(--color-foreground)">WP Pilot</span>
          <CardTitle className="mt-2">{t("registerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <Input
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              {t("register")}
            </Button>

            <div className="text-center text-sm text-(--color-muted-foreground)">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-(--color-primary) hover:underline">
                {t("login")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
