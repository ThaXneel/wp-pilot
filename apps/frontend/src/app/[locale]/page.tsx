"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Globe, ShoppingBag, FileText, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");

  const features = [
    { icon: ShoppingBag, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: FileText, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Globe, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: Shield, title: t("feature4Title"), desc: t("feature4Desc") },
  ];

  return (
    <div className="min-h-screen bg-(--color-background)">
      {/* Nav */}
      <header className="border-b border-(--color-border)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-(--color-foreground)">WP Pilot</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">{t("login")}</Button>
            </Link>
            <Link href="/register">
              <Button>{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-(--color-foreground) sm:text-5xl lg:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-6 text-lg text-(--color-muted-foreground) max-w-2xl mx-auto">
          {t("heroDesc")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">
              {t("getStarted")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">{t("login")}</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-(--color-border) bg-(--color-muted)">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold text-(--color-foreground)">
            {t("featuresTitle")}
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div key={idx} className="rounded-xl bg-(--color-card) p-6 border border-(--color-border)">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-primary)/10">
                  <feature.icon className="h-6 w-6 text-(--color-primary)" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-(--color-foreground)">{feature.title}</h3>
                <p className="mt-2 text-sm text-(--color-muted-foreground)">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-(--color-foreground)">{t("ctaTitle")}</h2>
        <p className="mt-4 text-lg text-(--color-muted-foreground)">{t("ctaDesc")}</p>
        <div className="mt-8">
          <Link href="/register">
            <Button size="lg">
              {t("getStarted")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-(--color-border) py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-(--color-muted-foreground)">
          &copy; {new Date().getFullYear()} WP Pilot. {t("allRightsReserved")}
        </div>
      </footer>
    </div>
  );
}
