"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Dropdown, DropdownItem } from "./Dropdown";

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("settings");

  const switchLocale = (newLocale: string) => {
    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <Dropdown
      trigger={
        <span className="flex items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors text-sm">
          <Languages className="h-5 w-5" />
          <span className="uppercase font-medium">{locale}</span>
        </span>
      }
    >
      <DropdownItem onClick={() => switchLocale("en")}>
        {t("english")} {locale === "en" && "✓"}
      </DropdownItem>
      <DropdownItem onClick={() => switchLocale("fr")}>
        {t("french")} {locale === "fr" && "✓"}
      </DropdownItem>
    </Dropdown>
  );
}

export { LanguageSwitcher };
