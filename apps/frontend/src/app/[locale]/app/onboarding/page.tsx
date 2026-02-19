"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Copy, Download, Link2, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = ["account", "install", "connect", "ready"] as const;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [, setConnected] = useState(false);

  const generateToken = useMutation({
    mutationFn: async () => {
      const res = await api<{ token: string }>("/onboarding/generate-token", { method: "POST" });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
    },
  });

  const verifyConnection = useMutation({
    mutationFn: async () => {
      const res = await api<{ verified: boolean }>("/onboarding/verify", { method: "POST" });
      if (!res.success) throw new Error(res.error);
      if (!res.data.verified) throw new Error("not_verified");
      return res.data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        setConnected(true);
        setCurrentStep(3);
      }
    },
  });

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                idx <= currentStep
                  ? "bg-(--color-primary) text-white"
                  : "bg-(--color-muted) text-(--color-muted-foreground)"
              }`}
            >
              {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
            </div>
            <span className="hidden text-sm sm:inline text-(--color-muted-foreground)">
              {t(`steps.${step}`)}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="mx-2 h-px w-8 bg-(--color-border)" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{t(`steps.${STEPS[currentStep]}`)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0: Account */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <p className="text-(--color-muted-foreground)">{t("accountDesc")}</p>
              <div className="rounded-lg bg-(--color-muted) p-4">
                <p className="text-sm">✅ {t("accountReady")}</p>
              </div>
              <Button onClick={next}>
                {t("next")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Install Plugin */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-(--color-muted-foreground)">{t("installDesc")}</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-(--color-muted-foreground)">
                <li>{t("installStep1")}</li>
                <li>{t("installStep2")}</li>
                <li>{t("installStep3")}</li>
              </ol>
              <a
                href={`${API_BASE}/onboarding/download-plugin`}
                download
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-md border border-(--color-border) bg-transparent hover:bg-(--color-accent) transition-colors"
              >
                <Download className="mr-2 h-4 w-4" /> {t("downloadPlugin")}
              </a>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={prev}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
                </Button>
                <Button onClick={next}>
                  {t("next")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Connect */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-(--color-muted-foreground)">{t("connectDesc")}</p>

              {!token ? (
                <Button onClick={() => generateToken.mutate()} loading={generateToken.isPending}>
                  <Link2 className="mr-2 h-4 w-4" /> {t("generateToken")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-(--color-border) p-3">
                    <code className="flex-1 break-all text-sm font-mono text-(--color-foreground)">
                      {token}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyToken}>
                      <Copy className="h-4 w-4" />
                      {copied ? t("copied") : t("copy")}
                    </Button>
                  </div>
                  <p className="text-sm text-(--color-muted-foreground)">{t("pasteToken")}</p>
                  <Button onClick={() => verifyConnection.mutate()} loading={verifyConnection.isPending}>
                    {t("verifyConnection")}
                  </Button>
                  {verifyConnection.isError && (
                    <p className="text-sm text-(--color-destructive)">{t("verifyFailed")}</p>
                  )}
                  <p className="text-xs text-(--color-muted-foreground)">
                    {t("verifyHint")}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={prev}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {currentStep === 3 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-(--color-foreground)">{t("readyTitle")}</h3>
              <p className="text-(--color-muted-foreground)">{t("readyDesc")}</p>
              <Link
                href="/app/dashboard"
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-md bg-(--color-primary) text-(--color-primary-foreground) hover:opacity-90 transition-colors"
              >
                {t("goToDashboard")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
