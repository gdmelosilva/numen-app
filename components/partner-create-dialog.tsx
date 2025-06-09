"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreatePartnerForm } from "@/components/create-partner-form";

interface PartnerCreateDialogProps {
  onSuccess?: () => void;
}

export function PartnerCreateDialog({ onSuccess }: PartnerCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Criar Novo Parceiro</DialogTitle>
        <CreatePartnerForm onCreate={() => {
          setOpen(false);
          onSuccess?.();
        }} />
      </DialogContent>
    </Dialog>
  );
}