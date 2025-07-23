import React from "react";
import { TicketSelectionDialog } from "@/components/TicketSelectionDialog";
import { Button } from "@/components/ui/button";

export function TestTicketDialog() {
  const [selectedId, setSelectedId] = React.useState("");
  const [selectedTitle, setSelectedTitle] = React.useState("");

  return (
    <div className="p-4">
      <h3>Teste do Dialog de Tickets</h3>
      <TicketSelectionDialog
        trigger={
          <Button variant="outline">
            {selectedTitle || "Teste - Selecionar Ticket"}
          </Button>
        }
        onSelect={(id, title) => {
          setSelectedId(id);
          setSelectedTitle(title);
          console.log("Ticket selecionado:", { id, title });
        }}
        selectedTicketId={selectedId}
      />
      {selectedId && (
        <div className="mt-4">
          <p>ID: {selectedId}</p>
          <p>Título: {selectedTitle}</p>
        </div>
      )}
    </div>
  );
}
