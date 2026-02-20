"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/routing";
import { Plus } from "lucide-react";
import { useSiteStore } from "@/stores/siteStore";

interface Post {
  id: string;
  title: string;
  status: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
}

export default function PostsPage() {
  const t = useTranslations("posts");
  const [page, setPage] = useState(1);
  const { selectedSiteId } = useSiteStore();

  const { data, isLoading } = useQuery({
    queryKey: ["posts", page, selectedSiteId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (selectedSiteId) params.set("siteId", selectedSiteId);
      const res = await api<PostsResponse>(`/posts?${params}`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>
        <Link href="/app/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("newPost")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("postTitle")}</TableHead>
                  <TableHead>{t("author")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.posts && data.posts.length > 0 ? (
                  data.posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="text-(--color-muted-foreground)">{post.author}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === "publish" ? "online" : "pending"}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-(--color-muted-foreground)">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/app/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="sm">{t("edit")}</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-(--color-muted-foreground)">
                      {t("noPosts")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            {t("previous")}
          </Button>
          <span className="text-sm text-(--color-muted-foreground)">
            {t("page")} {page}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(data?.posts?.length ?? 0) < 20}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
