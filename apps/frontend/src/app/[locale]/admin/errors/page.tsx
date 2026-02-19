"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface ErrorEntry {
  id: string;
  message: string;
  type: string;
  siteName: string;
  siteUrl: string;
  createdAt: string;
}

interface ErrorsResponse {
  errors: ErrorEntry[];
  total: number;
}

export default function AdminErrorsPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-errors", page],
    queryFn: async () => {
      const res = await api<ErrorsResponse>(`/admin/errors?page=${page}&limit=20`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground) flex items-center gap-2">
        <AlertTriangle className="h-6 w-6" /> {t("errorLogs")}
      </h1>

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
                  <TableHead>{t("errorMessage")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("site")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.errors && data.errors.length > 0 ? (
                  data.errors.map((err) => (
                    <TableRow key={err.id}>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm">{err.message}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{err.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{err.siteName}</p>
                          <p className="text-xs text-(--color-muted-foreground)">{err.siteUrl}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-(--color-muted-foreground) text-sm">
                        {new Date(err.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-(--color-muted-foreground)">
                      {t("noErrors")}
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(data?.errors?.length ?? 0) < 20}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
