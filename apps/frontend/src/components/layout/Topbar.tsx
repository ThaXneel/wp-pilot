"use client";

import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { User, LogOut } from "lucide-react";

function Topbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  return (
    <header className="flex h-16 items-center justify-end gap-2 border-b bg-card px-6">
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
    </header>
  );
}

export { Topbar };
