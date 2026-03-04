"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Mail, Settings } from "lucide-react";

interface EmailSettings {
  fromEmail: string;
  fromName: string;
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const queryClient = useQueryClient();

  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["admin-email-settings"],
    queryFn: async () => {
      const res = await api<EmailSettings>("/admin/settings/email");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    refetchOnMount: true,
    staleTime: 0,
    // @ts-expect-error - onSuccess callback for initialization
    onSuccess: (data: EmailSettings) => {
      setFromEmail(data.fromEmail);
      setFromName(data.fromName);
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const res = await api<EmailSettings>("/admin/settings/email", {
        method: "PUT",
        body: JSON.stringify({ fromEmail, fromName }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-settings"] });
      setMessage(t("settingsSaved"));
      setError("");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (err: Error) => {
      setError(err.message);
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromEmail.trim() || !fromName.trim()) {
      setError(t("requiredFields"));
      return;
    }
    updateSettings.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground) flex items-center gap-2">
        <Settings className="h-6 w-6" /> {t("settingsTitle")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> {t("emailSettings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-(--color-muted-foreground) mb-4">
            {t("emailSettingsDesc")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("fromName")}
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="WP Pilot"
              required
            />
            <Input
              label={t("fromEmail")}
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@yourdomain.com"
              required
            />

            {error && <p className="text-sm text-(--color-destructive)">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <Button type="submit" loading={updateSettings.isPending}>
              {t("saveSettings")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
