"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";
import { CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setStep("confirm");
    } catch {
      setError(t("resetError"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    setLoading(true);

    try {
      const res = await api("/auth/confirm-reset", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
        skipAuth: true,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setStep("done");
    } catch {
      setError(t("resetError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-background) px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="text-2xl font-bold text-(--color-foreground)">WP Pilot</span>
          <CardTitle className="mt-2">{t("resetTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <p className="text-sm text-(--color-muted-foreground)">{t("resetDesc")}</p>
              <Input
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-sm text-(--color-destructive)">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                {t("sendResetLink")}
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-(--color-primary) hover:underline">
                  {t("backToLogin")}
                </Link>
              </div>
            </form>
          )}

          {step === "confirm" && (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <p className="text-sm text-(--color-muted-foreground)">{t("resetEmailSent")}</p>
              <Input
                label={t("resetToken")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("pasteToken")}
                required
              />
              <Input
                label={t("newPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
              />
              {error && <p className="text-sm text-(--color-destructive)">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                {t("resetPassword")}
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-(--color-foreground)">{t("passwordResetDone")}</p>
              <Link href="/login">
                <Button className="w-full">{t("backToLogin")}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
