"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function NewClientPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const createClient = useMutation({
    mutationFn: async () => {
      const res = await api<{ clientId: string; connectToken: string }>("/admin/clients", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      setToken(data.connectToken);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t("requiredFields"));
      return;
    }
    setError("");
    createClient.mutate();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("addClient")}</h1>
      </div>

      {token ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("clientCreated")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-(--color-muted-foreground)">{t("tokenGenerated")}</p>
            <div className="rounded-lg border border-(--color-border) p-3">
              <code className="break-all text-sm font-mono text-(--color-foreground)">{token}</code>
            </div>
            <Button onClick={() => router.push("/admin/clients")}>{t("backToClients")}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                required
              />
              <Input
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
              />

              {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" loading={createClient.isPending}>
                  {t("create")}
                </Button>
                <Link href="/admin/clients">
                  <Button variant="outline">{t("cancel")}</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
