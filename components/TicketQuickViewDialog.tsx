"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Badge } from "@/components/ui/badge";
import type { Ticket } from "@/types/tickets";
import { MessageCard } from "@/components/message-card";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onLinkSelf: (ticket: Ticket) => void; // fix: exigir Ticket válido
  onOpenFullPage?: (ticket: Ticket) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export function TicketQuickViewDialog({
  open,
  onOpenChange,
  ticket,
  onLinkSelf,
  onOpenFullPage,
}: Readonly<Props>) {
  const t = ticket;

  // Mensagens em modo somente leitura
  type UIMsg = {
    id: string;
    ticket_id?: string;
    msgStatus?: string;
    msgPrivate?: boolean;
    msgHours?: number | string;
    msgBody?: string;
    createdAt?: string;
    user?: { name?: string; is_client?: boolean };
    attachments?: { id: string; name: string; path: string }[];
    is_system?: boolean;
    ref_msg_id?: string;
    system_hours?: number | null;
  };

  const [messages, setMessages] = useState<UIMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    type ApiMsg = {
      id: string;
      ticket_id: string;
      status_id: number | null;
      is_private: boolean;
      hours: number | null;
      body: string;
      created_at: string;
      user?: { first_name?: string; last_name?: string; is_client?: boolean };
      attachments?: { id: string; name: string; path: string }[];
      is_system?: boolean;
      ref_msg_id?: string;
      system_hours?: number | null;
    };

    async function loadMessages(ticketId: string) {
      setMessagesLoading(true);
      try {
        const res = await fetch(`/api/messages?ticket_id=${encodeURIComponent(ticketId)}`);
        if (!res.ok) throw new Error("Erro ao carregar mensagens");
        const data: ApiMsg[] = await res.json();
        if (cancelled) return;
        const mapped: UIMsg[] = (Array.isArray(data) ? data : []).map((m) => ({
          id: m.id,
          ticket_id: m.ticket_id,
          msgStatus: m.status_id != null ? String(m.status_id) : undefined,
          msgPrivate: m.is_private,
          msgHours: m.hours ?? undefined,
          msgBody: m.body,
          createdAt: m.created_at,
          user: {
            name: `${m.user?.first_name ?? ''} ${m.user?.last_name ?? ''}`.trim(),
            is_client: !!m.user?.is_client,
          },
          attachments: m.attachments,
          is_system: m.is_system,
          ref_msg_id: m.ref_msg_id,
          system_hours: m.system_hours ?? null,
        }));
        setMessages(mapped);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    if (open && t?.id) {
      loadMessages(t.id);
    } else {
      setMessages([]);
    }
    return () => {
      cancelled = true;
    };
  }, [open, t?.id]);

  const createdByName = useMemo(() => {
    if (!t?.created_by_user) return "-";
    const fn = t.created_by_user.first_name ?? "";
    const ln = t.created_by_user.last_name ?? "";
    const name = `${fn} ${ln}`.trim();
    return name || t.created_by_user.name || "-";
  }, [t?.created_by_user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            {t?.external_id || t?.id ? `Chamado ${t?.external_id || t?.id}` : "Detalhes do Chamado"}
          </DialogTitle>
        </DialogHeader>

        {!t ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Header resumido com ações à direita */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0 text-lg font-semibold leading-tight truncate">
                {t.title || "-"}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onOpenFullPage && (
                  <Button
                    variant="outline"
                    className="hidden sm:inline-flex"
                    onClick={() => {
                      if (t) onOpenFullPage(t);
                    }}
                  >
                    Abrir página completa
                  </Button>
                )}
                <Button
                  variant="colored2"
                  onClick={() => {
                    if (t) onLinkSelf(t);
                  }}
                >
                  Vincular-se
                </Button>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="detalhes" className="flex flex-col gap-3">
              <TabsList>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
              </TabsList>

              <TabsContent value="detalhes">
                {(() => {
                  // Normaliza possíveis formatos retornados pela API (/api/smartcare vs /api/tickets)
                  type ExtendedProject = (Ticket["project"]) & {
                    projectDesc?: string;
                    partner?: { partner_desc?: string };
                  };
                  const proj = (t.project ?? undefined) as ExtendedProject | undefined;
                  const projectName = proj?.projectDesc || proj?.projectName || undefined;
                  const partnerName = t.partner?.partner_desc || proj?.partner?.partner_desc || undefined;
                  return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[48vh]">
                  {/* Linha 1 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Projeto</div>
                    <div className="text-sm">{projectName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Parceiro</div>
                    <div className="text-sm">{partnerName || "-"}</div>
                  </div>
                  {/* Linha 2 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm">
                      {t.status?.name ? (
                        <ColoredBadge type="ticket_status" value={t.status} />
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Prioridade</div>
                    <div className="text-sm">
                      {t.priority?.name ? (
                        <ColoredBadge type="priority" value={t.priority.name} />
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  {/* Linha 3 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Categoria</div>
                    <div className="text-sm">
                      {t.category?.name ? <Badge variant="outline">{t.category.name}</Badge> : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Módulo</div>
                    <div className="text-sm">
                      {t.module?.name ? <Badge variant="outline">{t.module.name}</Badge> : "-"}
                    </div>
                  </div>
                  {/* Linha 4 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Tipo</div>
                    <div className="text-sm">
                      {t.type?.name ? <Badge variant="outline">{t.type.name}</Badge> : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Criado por</div>
                    <div className="text-sm mt-1">{createdByName}</div>
                  </div>
                  {/* Linha 5 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Criado em</div>
                    <div className="text-sm">{formatDate(t.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Atualizado em</div>
                    <div className="text-sm">{formatDate(t.updated_at)}</div>
                  </div>
                  {/* Linha 6 */}
                  <div>
                    <div className="text-xs text-muted-foreground">Prev. Fim</div>
                    <div className="text-sm">{formatDate(t.planned_end_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Fim Real</div>
                    <div className="text-sm">{formatDate(t.actual_end_date)}</div>
                  </div>
                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">Descrição</div>
                    <div className="text-sm whitespace-pre-wrap mt-1">
                      {t.description || "-"}
                    </div>
                  </div>
                  {/* Referências */}
                  {(t.ref_ticket_id || t.ref_external_id) && (
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground">Referências</div>
                      <div className="text-sm mt-1 flex flex-wrap gap-4">
                        {t.ref_ticket_id && (
                          <span>Ticket ref: {String(t.ref_ticket_id)}</span>
                        )}
                        {t.ref_external_id && (
                          <span>Chamado relacionado: {t.ref_external_id}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="mensagens">
                <div className="text-xs text-muted-foreground mb-2">Somente leitura</div>
                <div className="h-[48vh] overflow-auto pr-1 space-y-3">
                  {(() => {
                    if (messagesLoading) {
                      return <div className="text-sm text-muted-foreground">Carregando mensagens...</div>;
                    }
                    if (messages.length === 0) {
                      return <div className="text-sm text-muted-foreground">Nenhuma mensagem</div>;
                    }
                    return (
                      <>
                        {messages.map((m) => (
                          <MessageCard key={m.id} msg={m} />
                        ))}
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer removido para otimizar espaço; ações movidas para o header do conteúdo */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}