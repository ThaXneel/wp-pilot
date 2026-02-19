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

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
}

export default function EditPostPage() {
  const t = useTranslations("posts");
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [edits, setEdits] = useState<Partial<Post>>({});
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await api<Post>(`/posts/${postId}`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  // Derive form values: user edits override fetched data
  const title = edits.title ?? data?.title ?? "";
  const content = edits.content ?? data?.content ?? "";
  const status = edits.status ?? data?.status ?? "draft";

  const updatePost = useMutation({
    mutationFn: async () => {
      const res = await api(`/posts/${postId}`, {
        method: "PUT",
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
    updatePost.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("editPost")}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("postTitle")}
              value={title}
              onChange={(e) => setEdits(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-(--color-foreground) mb-1">
                {t("content")}
              </label>
              <textarea
                value={content}
                onChange={(e) => setEdits(prev => ({ ...prev, content: e.target.value }))}
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
                onChange={(e) => setEdits(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              >
                <option value="draft">{t("draft")}</option>
                <option value="publish">{t("published")}</option>
              </select>
            </div>

            {error && <p className="text-sm text-(--color-destructive)">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" loading={updatePost.isPending}>
                {t("save")}
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
