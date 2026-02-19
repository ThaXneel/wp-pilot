"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Link } from "@/i18n/routing";
import { Plus, Search } from "lucide-react";

interface Client {
  id: string;
  email: string;
  status: string;
  plan: string;
  siteCount: number;
  createdAt: string;
}

interface ClientsResponse {
  clients: Client[];
  total: number;
}

export default function ClientsPage() {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clients", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await api<ClientsResponse>(`/admin/clients?${params}`);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--color-foreground)">{t("clients")}</h1>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t("addClient")}
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted-foreground)" />
        <Input
          placeholder={t("searchClients")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
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
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("plan")}</TableHead>
                  <TableHead>{t("sites")}</TableHead>
                  <TableHead>{t("joined")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.clients && data.clients.length > 0 ? (
                  data.clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.email}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === "ACTIVE" ? "online" : client.status === "SUSPENDED" ? "destructive" : "pending"}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.plan}</TableCell>
                      <TableCell>{client.siteCount}</TableCell>
                      <TableCell className="text-(--color-muted-foreground)">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-(--color-muted-foreground)">
                      {t("noClients")}
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(data?.clients?.length ?? 0) < 20}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
