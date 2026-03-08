"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSiteStore } from "@/stores/siteStore";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  FileText,
  ClipboardList,
  Globe,
  Plus,
  Trash2,
  Clock,
  Package,
  AlertCircle,
} from "lucide-react";

interface SiteData {
  id: string;
  name: string;
  wpUrl: string;
  status: "ONLINE" | "OFFLINE" | "PENDING";
  healthScore: number;
  lastPing: string | null;
  wpVersion: string | null;
  errorCount: number;
}

interface DashboardStats {
  productCount: number;
  orderCount: number;
  postCount: number;
  recentActivity: number;
  sites: SiteData[];
  siteStats: Record<string, { products: number; orders: number; posts: number }>;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { setSites, selectedSiteId, selectSite } = useSiteStore();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [removeSite, setRemoveSite] = useState<SiteData | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api<DashboardStats>(`/dashboard/stats`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  // Sync sites into the site store so the switcher stays up-to-date
  useEffect(() => {
    if (data?.sites) {
      setSites(data.sites);
    }
  }, [data?.sites, setSites]);

  // SSE: Listen for real-time webhook events
  useEffect(() => {
    if (!accessToken) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const eventSource = new EventSource(`${apiBase}/events/stream`, {
      // Note: EventSource doesn't support headers natively.
      // For production, use a polyfill or pass token as query param.
    });

    eventSource.addEventListener("webhook", () => {
      // Refresh dashboard stats when a real-time event arrives
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    });

    eventSource.onerror = () => {
      // SSE will auto-reconnect; no action needed
    };

    return () => {
      eventSource.close();
    };
  }, [accessToken, queryClient]);

  // Handle site removal
  const handleRemoveSite = useCallback(async () => {
    if (!removeSite) return;
    setIsRemoving(true);
    try {
      const res = await api(`/sites/${removeSite.id}`, { method: "DELETE" });
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        setRemoveSite(null);
      }
    } finally {
      setIsRemoving(false);
    }
  }, [removeSite, queryClient]);

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

  const formatLastSync = (lastPing: string | null) => {
    if (!lastPing) return t("never");
    const diff = Date.now() - new Date(lastPing).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return `${minutes}m ${t("ago")}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${t("ago")}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${t("ago")}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>

      {/* Global Stats Cards — aggregated across all connected stores */}
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
                  {(data?.sites?.length ?? 0) > 1 && (
                    <p className="text-xs text-(--color-muted-foreground) mt-0.5">
                      {t("acrossAllSites", { count: data?.sites?.length ?? 0 })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Connected Sites — card grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-(--color-foreground) flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("connectedSites")}
          </h2>
          <Link href="/app/onboarding">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t("addSite")}
            </Button>
          </Link>
        </div>

        {data?.sites && data.sites.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.sites.map((site) => {
              const sitePreview = data.siteStats?.[site.id];

              return (
                <Card
                  key={site.id}
                  className="group relative hover:border-(--color-primary) hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  onClick={() => {
                    selectSite(site.id);
                  }}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Site Header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-(--color-foreground) truncate group-hover:text-(--color-primary) transition-colors">
                          {site.name}
                        </p>
                        <p className="text-xs text-(--color-muted-foreground) truncate mt-0.5">
                          {site.wpUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            site.status === "ONLINE"
                              ? "online"
                              : site.status === "OFFLINE"
                              ? "offline"
                              : "pending"
                          }
                        >
                          {site.status}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveSite(site);
                          }}
                          className="text-(--color-muted-foreground) hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100 cursor-pointer"
                          title={t("removeSite")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-(--color-muted-foreground)">{t("health")}</span>
                        <span className="font-medium text-(--color-foreground)">{site.healthScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-(--color-muted) rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            site.healthScore >= 80
                              ? "bg-green-500"
                              : site.healthScore >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${site.healthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Per-site Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 p-2">
                        <Package className="h-3.5 w-3.5 text-blue-500 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-(--color-foreground)">
                          {sitePreview?.products ?? "—"}
                        </p>
                        <p className="text-[10px] text-(--color-muted-foreground)">{t("products")}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <ClipboardList className="h-3.5 w-3.5 text-green-500 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-(--color-foreground)">
                          {sitePreview?.orders ?? "—"}
                        </p>
                        <p className="text-[10px] text-(--color-muted-foreground)">{t("orders")}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <FileText className="h-3.5 w-3.5 text-purple-500 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-(--color-foreground)">
                          {sitePreview?.posts ?? "—"}
                        </p>
                        <p className="text-[10px] text-(--color-muted-foreground)">{t("posts")}</p>
                      </div>
                    </div>

                    {/* Footer: Last sync & errors */}
                    <div className="flex items-center justify-between text-xs text-(--color-muted-foreground) pt-1 border-t border-(--color-border)">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSync(site.lastPing)}</span>
                      </div>
                      {site.errorCount > 0 && (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          <span>{site.errorCount} {t("errors")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Globe className="h-10 w-10 text-(--color-muted-foreground) mx-auto mb-3" />
              <p className="text-(--color-muted-foreground)">{t("noSites")}</p>
              <Link
                href="/app/onboarding"
                className="mt-2 inline-block text-(--color-primary) hover:underline"
              >
                {t("connectFirst")}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Remove Site Confirmation Modal */}
      <Modal
        open={!!removeSite}
        onClose={() => setRemoveSite(null)}
        title={t("removeSiteTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-(--color-muted-foreground)">
            {t("removeSiteConfirm", { name: removeSite?.name ?? "" })}
          </p>
          <div className="rounded-lg bg-(--color-muted) p-3">
            <p className="font-medium text-sm">{removeSite?.name}</p>
            <p className="text-xs text-(--color-muted-foreground)">{removeSite?.wpUrl}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveSite(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSite}
              loading={isRemoving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("removeSite")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
