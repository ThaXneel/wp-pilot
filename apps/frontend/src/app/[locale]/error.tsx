"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-background) px-4 text-center">
      <h1 className="text-4xl font-bold text-(--color-destructive)">{t("error")}</h1>
      <p className="mt-4 text-lg text-(--color-muted-foreground)">{t("somethingWrong")}</p>
      <Button className="mt-6" onClick={() => reset()}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
