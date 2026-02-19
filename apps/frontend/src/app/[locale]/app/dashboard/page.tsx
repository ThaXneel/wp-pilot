"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/routing";
import { ShoppingBag, FileText, ClipboardList, Globe } from "lucide-react";

interface DashboardStats {
  productCount: number;
  orderCount: number;
  postCount: number;
  sites: Array<{
    id: string;
    name: string;
    wpUrl: string;
    status: "ONLINE" | "OFFLINE" | "PENDING";
    healthScore: number;
  }>;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api<DashboardStats>("/dashboard/stats");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      label: t("products"),
      value: data?.productCount ?? 0,
      icon: ShoppingBag,
      href: "/app/products",
      color: "text-blue-500",
    },
    {
      label: t("orders"),
      value: data?.orderCount ?? 0,
      icon: ClipboardList,
      href: "/app/orders",
      color: "text-green-500",
    },
    {
      label: t("posts"),
      value: data?.postCount ?? 0,
      icon: FileText,
      href: "/app/posts",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="hover:border-(--color-primary) transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg bg-(--color-muted) p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-(--color-muted-foreground)">{stat.label}</p>
                  <p className="text-2xl font-bold text-(--color-foreground)">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Connected Sites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("connectedSites")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.sites && data.sites.length > 0 ? (
            <div className="space-y-3">
              {data.sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-lg border border-(--color-border) p-4"
                >
                  <div>
                    <p className="font-medium text-(--color-foreground)">{site.name}</p>
                    <p className="text-sm text-(--color-muted-foreground)">{site.wpUrl}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-(--color-muted-foreground)">
                      {site.healthScore}%
                    </span>
                    <Badge variant={site.status === "ONLINE" ? "online" : site.status === "OFFLINE" ? "offline" : "pending"}>
                      {site.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-(--color-muted-foreground)">{t("noSites")}</p>
              <Link
                href="/app/onboarding"
                className="mt-2 inline-block text-(--color-primary) hover:underline"
              >
                {t("connectFirst")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
