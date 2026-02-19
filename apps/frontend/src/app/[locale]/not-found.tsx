"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-(--color-background) px-4 text-center">
      <h1 className="text-6xl font-bold text-(--color-foreground)">404</h1>
      <p className="mt-4 text-lg text-(--color-muted-foreground)">{t("notFound")}</p>
      <Link href="/" className="mt-6">
        <Button>{t("goHome")}</Button>
      </Link>
    </div>
  );
}
