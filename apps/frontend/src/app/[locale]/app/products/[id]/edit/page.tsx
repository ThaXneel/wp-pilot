"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  status: string;
}

export default function EditProductPage() {
  const t = useTranslations("products");
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [edits, setEdits] = useState<Partial<Product>>({});
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await api<Product>(`/products/${productId}`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  // Derive form values: user edits override fetched data
  const title = edits.title ?? data?.title ?? "";
  const description = edits.description ?? data?.description ?? "";
  const price = edits.price ?? data?.price ?? "";
  const status = edits.status ?? data?.status ?? "draft";

  const updateProduct = useMutation({
    mutationFn: async () => {
      const res = await api(`/products/${productId}`, {
        method: "PUT",
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
    updateProduct.mutate();
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
      <div className="flex items-center gap-4">
        <Link href="/app/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("editProduct")}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("name")}
              value={title}
              onChange={(e) => setEdits(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setEdits(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              />
            </div>
            <Input
              label={t("price")}
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setEdits(prev => ({ ...prev, price: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("status")}
              </label>
              <select
                value={status}
                onChange={(e) => setEdits(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              >
                <option value="draft">{t("draft")}</option>
                <option value="publish">{t("published")}</option>
              </select>
            </div>

            {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={updateProduct.isPending}>
                {t("save")}
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
