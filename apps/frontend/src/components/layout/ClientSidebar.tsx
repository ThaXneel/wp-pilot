"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

function ClientSidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: `/${locale}/app/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/app/products`, label: t("products"), icon: ShoppingBag },
    { href: `/${locale}/app/orders`, label: t("orders"), icon: ClipboardList },
    { href: `/${locale}/app/posts`, label: t("blog"), icon: FileText },
    { href: `/${locale}/app/settings`, label: t("settings"), icon: Settings },
  ];

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold text-primary">WP Pilot</h1>
      </div>
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-card border shadow-sm cursor-pointer"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card">
        {nav}
      </aside>
    </>
  );
}

export { ClientSidebar };
