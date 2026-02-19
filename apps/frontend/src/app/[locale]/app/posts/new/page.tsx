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

export default function NewPostPage() {
  const t = useTranslations("posts");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");

  const createPost = useMutation({
    mutationFn: async () => {
      const res = await api("/posts", {
        method: "POST",
        body: JSON.stringify({ title, content, status }),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      router.push("/app/posts");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    setError("");
    createPost.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("newPost")}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("postTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("content")}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentPlaceholder")}
                rows={12}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              />
            </div>
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
              <Button type="submit" loading={createPost.isPending}>
                {t("create")}
              </Button>
              <Link href="/app/posts">
                <Button variant="outline">{t("cancel")}</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
