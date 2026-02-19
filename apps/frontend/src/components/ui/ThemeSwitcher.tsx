"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Dropdown, DropdownItem } from "./Dropdown";
import { useTranslations } from "next-intl";

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");

  const icon =
    theme === "dark" ? (
      <Moon className="h-5 w-5" />
    ) : theme === "light" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Monitor className="h-5 w-5" />
    );

  return (
    <Dropdown trigger={<span className="p-2 rounded-md hover:bg-accent transition-colors">{icon}</span>}>
      <DropdownItem onClick={() => setTheme("system")}>
        <Monitor className="mr-2 h-4 w-4" /> {t("systemTheme")}
      </DropdownItem>
      <DropdownItem onClick={() => setTheme("dark")}>
        <Moon className="mr-2 h-4 w-4" /> {t("darkTheme")}
      </DropdownItem>
      <DropdownItem onClick={() => setTheme("light")}>
        <Sun className="mr-2 h-4 w-4" /> {t("lightTheme")}
      </DropdownItem>
    </Dropdown>
  );
}

export { ThemeSwitcher };
