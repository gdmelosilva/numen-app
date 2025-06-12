"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpenText, Calendar, UserCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import React from "react";
import type { Ticket } from "@/types/tickets";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SmartbuildManagementPage() {
  // Exemplo: lista de tickets (mock ou fetch real)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!user || userLoading) return;
    async function fetchTickets() {
      setLoading(true);
      setError(null);
      try {
        if (!user?.partner_id) throw new Error("Usuário sem projeto vinculado");
        const response = await fetch(`/api/smartbuild/tickets?partner_id=${user.partner_id}`);
        if (!response.ok) throw new Error("Erro ao buscar tickets");
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        setError((err instanceof Error ? err.message : "Erro ao buscar tickets"));
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-destructive">{error}</div>;
  }

  return (
    <Tabs defaultValue="tickets" className="w-full h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
      </TabsList>
      <Card className="p-6 rounded-md w-full h-full">
        <TabsContent value="tickets">
          <CardHeader className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Tickets do Projeto</div>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="my-4 mb-4" />
            {tickets.length === 0 && (
              <div className="text-muted-foreground text-center py-8">Nenhum ticket encontrado.</div>
            )}
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="mb-4">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
                      <div className="text-lg font-semibold flex-1">
                        {String(ticket.external_id).padStart(5, "0")} - {ticket.title}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-4 text-md text-muted-foreground">
                        <div className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("pt-BR") : "-"}
                        </div>
                        <div className="inline-flex items-center gap-1 italic text-md">
                          <UserCircle className="w-4 h-4" />
                          {ticket.created_by_user ? `${ticket.created_by_user.first_name || ""} ${ticket.created_by_user.last_name || ""}`.trim() || "-" : ticket.created_by || "-"}
                        </div>
                        <Badge variant="default" className="text-md">{ticket.status?.name || ticket.status_id || "-"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-2">
                        <BookOpenText className="w-4 h-4" />
                        Descrição
                      </div>
                      {ticket.description || "-"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
