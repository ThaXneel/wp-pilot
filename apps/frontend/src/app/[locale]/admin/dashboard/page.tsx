"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Users, Globe, Activity, AlertTriangle } from "lucide-react";

interface AdminOverview {
  totalClients: number;
  sitesOnline: number;
  sitesOffline: number;
  recentActivity: Array<{
    id: string;
    action: string;
    clientEmail: string;
    createdAt: string;
  }>;
  recentErrors: number;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await api<AdminOverview>("/admin/overview");
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
    { label: t("totalClients"), value: data?.totalClients ?? 0, icon: Users, color: "text-blue-500" },
    { label: t("sitesOnline"), value: data?.sitesOnline ?? 0, icon: Globe, color: "text-green-500" },
    { label: t("sitesOffline"), value: data?.sitesOffline ?? 0, icon: Globe, color: "text-red-500" },
    { label: t("recentErrors"), value: data?.recentErrors ?? 0, icon: AlertTriangle, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("dashboard")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
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
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> {t("recentActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-(--color-border) p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-(--color-foreground)">{activity.action}</p>
                    <p className="text-xs text-(--color-muted-foreground)">{activity.clientEmail}</p>
                  </div>
                  <span className="text-xs text-(--color-muted-foreground)">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-(--color-muted-foreground) py-4">
              {t("noActivity")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
