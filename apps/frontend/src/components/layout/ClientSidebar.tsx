"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSiteStore } from "@/stores/siteStore";
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
  const { sidebarCollapsed } = useSiteStore();

  const links = [
    { href: `/${locale}/app/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/app/products`, label: t("products"), icon: ShoppingBag },
    { href: `/${locale}/app/orders`, label: t("orders"), icon: ClipboardList },
    { href: `/${locale}/app/posts`, label: t("blog"), icon: FileText },
    { href: `/${locale}/app/settings`, label: t("settings"), icon: Settings },
  ];

  const nav = (collapsed = false) => (
    <nav className="flex flex-col h-full p-4">
      {/* Top: OBMAT Branding */}
      {!collapsed && (
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-primary">OBMAT</h1>
          <p className="text-[10px] text-muted-foreground">Online Business Manager Tool</p>
        </div>
      )}
      {collapsed && (
        <div className="mb-6 flex justify-center">
          <span className="text-xl font-bold text-primary">OB</span>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom: NEXNEEL Credit */}
      {!collapsed && (
        <div className="mt-auto border-t border-(--color-border) pt-3 px-2">
          <p className="text-[10px] text-muted-foreground text-center">© NEXNEEL</p>
        </div>
      )}
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
        {nav(false)}
      </aside>

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:border-r md:bg-card transition-all duration-200",
          sidebarCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        {nav(sidebarCollapsed)}
      </aside>
    </>
  );
}

export { ClientSidebar };
