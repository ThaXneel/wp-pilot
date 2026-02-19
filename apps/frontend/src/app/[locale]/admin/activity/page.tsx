"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Activity } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  clientEmail: string;
  createdAt: string;
}

interface ActivityResponse {
  activities: ActivityEntry[];
  total: number;
}

export default function AdminActivityPage() {
  const t = useTranslations("admin");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const res = await api<ActivityResponse>("/admin/activity?limit=50");
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground) flex items-center gap-2">
        <Activity className="h-6 w-6" /> {t("activityStream")}
      </h1>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : data?.activities && data.activities.length > 0 ? (
            <div className="space-y-4">
              {data.activities.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 border-b border-(--color-border) pb-4 last:border-0 last:pb-0"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-(--color-primary) shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-(--color-foreground)">
                        {entry.action}
                      </p>
                      <span className="text-xs text-(--color-muted-foreground)">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-(--color-muted-foreground)">{entry.clientEmail}</p>
                    {entry.details && (
                      <p className="mt-1 text-sm text-(--color-muted-foreground)">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-(--color-muted-foreground) py-8">
              {t("noActivity")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
