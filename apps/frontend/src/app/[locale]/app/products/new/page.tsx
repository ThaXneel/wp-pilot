"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function NewProductPage() {
  const t = useTranslations("products");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");

  const createProduct = useMutation({
    mutationFn: async () => {
      const res = await api("/products", {
        method: "POST",
        body: JSON.stringify({ title, description, price, status }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push("/app/products");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) {
      setError(t("requiredFields"));
      return;
    }
    setError("");
    createProduct.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("newProduct")}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("name")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              />
            </div>
            <Input
              label={t("price")}
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("status")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              >
                <option value="draft">{t("draft")}</option>
                <option value="publish">{t("published")}</option>
              </select>
            </div>

            {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={createProduct.isPending}>
                {t("create")}
              </Button>
              <Link href="/app/products">
                <Button variant="outline">{t("cancel")}</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
