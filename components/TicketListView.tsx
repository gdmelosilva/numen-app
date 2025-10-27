
import { TicketCard } from "@/components/ticket-card";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "@/app/main/smartcare/management/columns";

import type { Ticket } from "@/types/tickets";
import type { AuthenticatedUser } from "@/lib/api-auth";
import React from "react";


interface TicketListViewProps {
  readonly tickets?: ReadonlyArray<Ticket>;
  readonly viewType?: "table" | "cards";
  readonly user?: AuthenticatedUser | null;
  readonly loading?: boolean;
  readonly onLinkResource?: (ticket: Ticket) => void;
  readonly onRowClick?: (ticket: Ticket) => void;
  readonly emptyMessage?: string;
}


export function TicketListView({
  tickets,
  viewType = "table",
  user,
  loading = false,
  onLinkResource,
  onRowClick,
  emptyMessage = "Nenhum ticket encontrado.",
}: TicketListViewProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Carregando tickets...</span>
      </div>
    );
  }

  // Empty state
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">{emptyMessage}</span>
      </div>
    );
  }

  // Cards view
  if (viewType === "cards") {
    return (
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            user={user}
            onLinkResource={onLinkResource}
            onClick={onRowClick}
          />
        ))}
      </div>
    );
  }

  // Table view (no internal scroll)
  return (
    <DataTable
      columns={getColumns(user, onLinkResource)}
      data={tickets ? [...tickets] : []}
      onRowClick={onRowClick}
      showColumnVisibility={true}
      showPagination={false}
    />
  );
}
