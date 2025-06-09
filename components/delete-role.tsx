"use client";

import { Button } from "./ui/button";
import { useDeleteRoles } from "@/hooks/useRoles";
import { useState } from "react";

interface DeleteRoleProps {
  selectedIds: number[];
  onDeleted?: () => void;
}

const DeleteRole = ({ selectedIds, onDeleted }: DeleteRoleProps) => {
  const { deleteRoles, isDeleting, deleteError } = useDeleteRoles();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await deleteRoles(selectedIds);
    if (ok && onDeleted) onDeleted();
    setConfirming(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        disabled={selectedIds.length === 0 || isDeleting}
        onClick={() => setConfirming(true)}
      >
        Deletar Cargo{selectedIds.length > 1 ? "s" : ""}
      </Button>
      {confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded shadow space-y-4">
            <p>
              Tem certeza que deseja deletar {selectedIds.length} cargo{selectedIds.length > 1 ? "s" : ""}?
            </p>
            {deleteError && <p className="text-red-500">{deleteError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deletando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteRole;