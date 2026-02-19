"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { User, Palette, Globe, Lock } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.email?.split("@")[0] ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await api<{ user: typeof user }>("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name, email }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      setProfileMsg(t("profileUpdated"));
      setTimeout(() => setProfileMsg(""), 3000);
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await api("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg(t("passwordUpdated"));
      setPasswordError("");
      setTimeout(() => setPasswordMsg(""), 3000);
    },
    onError: (err: Error) => {
      setPasswordError(err.message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("passwordTooShort"));
      return;
    }
    setPasswordError("");
    changePassword.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {t("profile")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {profileMsg && (
              <p className="text-sm text-green-600">{profileMsg}</p>
            )}
            <Button type="submit" loading={updateProfile.isPending}>
              {t("saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t("changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label={t("currentPassword")}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label={t("newPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-sm text-(--color-destructive)">{passwordError}</p>
            )}
            {passwordMsg && (
              <p className="text-sm text-green-600">{passwordMsg}</p>
            )}
            <Button type="submit" loading={changePassword.isPending}>
              {t("updatePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> {t("preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-(--color-muted-foreground)" />
              <span className="text-sm text-(--color-foreground)">{t("language")}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-(--color-muted-foreground)" />
              <span className="text-sm text-(--color-foreground)">{t("theme")}</span>
            </div>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
