"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserEditForm } from "@/components/user-edit-form";
import type { User } from "@/types/users";

interface UserEditDialogProps {
  user: User;
  onSuccess?: () => void;
}

export function UserEditDialog({ user, onSuccess }: UserEditDialogProps) {
  const [open, setOpen] = useState(true);

  // When dialog closes, unmount it by calling onSuccess (which in parent sets editOpen to false)
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Editar Usuário</DialogTitle>
        <UserEditForm
          user={user}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}