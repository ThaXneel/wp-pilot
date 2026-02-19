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

interface Order {
  id: string;
  number: string;
  status: string;
  total: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  createdAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "completed": return "online" as const;
    case "processing": return "pending" as const;
    case "cancelled": case "failed": return "destructive" as const;
    default: return "default" as const;
  }
};

export default function OrdersPage() {
  const t = useTranslations("orders");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: async () => {
      const res = await api<OrdersResponse>(`/orders?page=${page}&limit=20`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-foreground)">{t("title")}</h1>

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
                  <TableHead>{t("order")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("total")}</TableHead>
                  <TableHead>{t("items")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.orders && data.orders.length > 0 ? (
                  data.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.customerName}</p>
                          <p className="text-xs text-(--color-muted-foreground)">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.currency} {order.total}</TableCell>
                      <TableCell>{order.itemsCount}</TableCell>
                      <TableCell className="text-(--color-muted-foreground)">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-(--color-muted-foreground)">
                      {t("noOrders")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            {t("previous")}
          </Button>
          <span className="text-sm text-(--color-muted-foreground)">
            {t("page")} {page}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(data?.orders?.length ?? 0) < 20}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
