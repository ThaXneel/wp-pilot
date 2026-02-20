"use client";

import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { useAuthStore } from "@/stores/authStore";
import { useSiteStore, Site } from "@/stores/siteStore";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { User, LogOut, Bell, Globe, ChevronDown, PanelLeftClose, PanelLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

function SiteSwitcher() {
  const { sites, selectedSiteId, selectSite } = useSiteStore();
  const selected = sites.find((s) => s.id === selectedSiteId);

  if (sites.length === 0) return null;

  return (
    <Dropdown
      align="left"
      trigger={
        <span className="flex items-center gap-2 rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-accent transition-colors">
          <Globe className="h-4 w-4 text-(--color-primary)" />
          <span className="max-w-35 truncate">{selected?.name ?? "Select site"}</span>
          <ChevronDown className="h-3 w-3 text-(--color-muted-foreground)" />
        </span>
      }
      className="w-64"
    >
      {sites.map((site: Site) => (
        <DropdownItem
          key={site.id}
          onClick={() => selectSite(site.id)}
          className={site.id === selectedSiteId ? "bg-accent" : ""}
        >
          <div className="flex flex-col items-start w-full">
            <span className="font-medium truncate w-full">{site.name}</span>
            <span className="text-xs text-(--color-muted-foreground) flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  site.status === "ONLINE"
                    ? "bg-green-500"
                    : site.status === "OFFLINE"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              />
              {site.wpUrl}
            </span>
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

function NotificationBell() {
  const t = useTranslations("common");

  return (
    <Dropdown
      trigger={
        <span className="relative flex items-center rounded-md p-2 hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {/* Dot indicator for unread */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-(--color-primary)" />
        </span>
      }
      className="w-72"
    >
      <div className="px-3 py-2 border-b border-(--color-border)">
        <p className="text-sm font-medium">{t("notifications")}</p>
      </div>
      <div className="py-4 text-center text-sm text-(--color-muted-foreground)">
        {t("noNotifications")}
      </div>
    </Dropdown>
  );
}

function Topbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useSiteStore();

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center rounded-md p-2 hover:bg-accent transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
        <SiteSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <LanguageSwitcher />
        <ThemeSwitcher />
        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors text-sm">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">{user?.email}</span>
            </span>
          }
        >
          <DropdownItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

export { Topbar };
