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
  const { setSites, selectedSiteId } = useSiteStore();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [removeSite, setRemoveSite] = useState<SiteData | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedSiteId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSiteId) params.set("siteId", selectedSiteId);
      const res = await api<DashboardStats>(`/dashboard/stats?${params}`);
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("connectedSites")}
            </CardTitle>
            <Link href="/app/onboarding">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> {t("addSite")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.sites && data.sites.length > 0 ? (
            <div className="space-y-4">
              {data.sites.map((site) => {
                const sitePreview = data.siteStats?.[site.id];

                return (
                  <div
                    key={site.id}
                    className="rounded-lg border border-(--color-border) p-4 space-y-3"
                  >
                    {/* Site Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-(--color-foreground)">{site.name}</p>
                        <p className="text-sm text-(--color-muted-foreground)">{site.wpUrl}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-(--color-muted-foreground)">
                          {site.healthScore}%
                        </span>
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
                          onClick={() => setRemoveSite(site)}
                          className="text-(--color-muted-foreground) hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
                          title={t("removeSite")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Site Preview Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-(--color-muted-foreground)">
                        <Package className="h-3.5 w-3.5 text-blue-500" />
                        <span>
                          {sitePreview?.products ?? "—"} {t("products")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-(--color-muted-foreground)">
                        <ClipboardList className="h-3.5 w-3.5 text-green-500" />
                        <span>
                          {sitePreview?.orders ?? "—"} {t("orders")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-(--color-muted-foreground)">
                        <FileText className="h-3.5 w-3.5 text-purple-500" />
                        <span>
                          {sitePreview?.posts ?? "—"} {t("posts")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-(--color-muted-foreground)">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span>{formatLastSync(site.lastPing)}</span>
                      </div>
                      {site.errorCount > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>
                            {site.errorCount} {t("errors")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
