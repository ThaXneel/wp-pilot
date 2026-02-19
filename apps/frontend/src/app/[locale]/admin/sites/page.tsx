"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Globe } from "lucide-react";

interface Site {
  id: string;
  name: string;
  wpUrl: string;
  status: "ONLINE" | "OFFLINE" | "PENDING";
  healthScore: number;
  wpVersion: string | null;
  lastPing: string | null;
  clientEmail: string;
}

interface SitesResponse {
  sites: Site[];
  total: number;
}

const statusIndicator = (status: string) => {
  switch (status) {
    case "ONLINE": return "🟢";
    case "OFFLINE": return "🔴";
    default: return "🟡";
  }
};

export default function AdminSitesPage() {
  const t = useTranslations("admin");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sites"],
    queryFn: async () => {
      const res = await api<SitesResponse>("/admin/sites");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground) flex items-center gap-2">
        <Globe className="h-6 w-6" /> {t("sites")}
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
                  <TableHead>{t("siteName")}</TableHead>
                  <TableHead>{t("url")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("health")}</TableHead>
                  <TableHead>{t("wpVersion")}</TableHead>
                  <TableHead>{t("lastPing")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.sites && data.sites.length > 0 ? (
                  data.sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell className="text-(--color-muted-foreground) text-sm">{site.wpUrl}</TableCell>
                      <TableCell className="text-sm">{site.clientEmail}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {statusIndicator(site.status)}
                          <Badge variant={site.status === "ONLINE" ? "online" : site.status === "OFFLINE" ? "offline" : "pending"}>
                            {site.status}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>{site.healthScore}%</TableCell>
                      <TableCell className="text-(--color-muted-foreground)">{site.wpVersion ?? "—"}</TableCell>
                      <TableCell className="text-(--color-muted-foreground) text-sm">
                        {site.lastPing ? new Date(site.lastPing).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-(--color-muted-foreground)">
                      {t("noSites")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
