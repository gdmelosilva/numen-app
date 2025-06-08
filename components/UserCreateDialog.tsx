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
import { SignUpForm } from "@/components/sign-up-form";

interface UserCreateDialogProps {
  onSuccess?: () => void;
}

export function UserCreateDialog({ onSuccess }: UserCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Criar Novo Usuário</DialogTitle>
        <SignUpForm onSignUp={() => {
          setOpen(false);
          onSuccess?.();
        }} />
      </DialogContent>
    </Dialog>
  );
}