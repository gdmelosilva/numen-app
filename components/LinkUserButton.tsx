import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Link2 } from "lucide-react";
import React, { useState } from "react";
import type { User } from "@/types/users";
import { Input } from "./ui/input";

interface LinkUserButtonProps {
  partnerId: string;
  onLinked?: () => void;
}

export const LinkUserButton: React.FC<LinkUserButtonProps> = ({
  partnerId,
  onLinked,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const USERS_PER_PAGE = 5;

  const openDialog = async () => {
    setShowDialog(true);
    setError(null);
    setSelectedUser(null);
    setFetchingUsers(true);
    try {
      const res = await fetch("/api/admin/user-partner/partnerless-users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const result = await res.json();
      setUsers(result.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleLink = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/user-partner/link-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, partnerId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao vincular usuário");
      }
      setShowDialog(false);
      if (onLinked) onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Filtro dinâmico de busca
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    page * USERS_PER_PAGE,
    (page + 1) * USERS_PER_PAGE
  );

  function getRoleLabel(role: number | null, isClient: boolean) {
    if (isClient) return "Key-User";
    if (role === 1) return "Administrador";
    if (role === 2) return "Gerente";
    if (role === 3) return "Funcional";
    return "Usuário";
  }

  // Resetar página ao buscar
  React.useEffect(() => {
    setPage(0);
  }, [search, users]);

  return (
    <>
      <Button
        variant="default"
        onClick={openDialog}
        title="Vincular usuário"
      >
        <Link2 className="w-4 h-4 mr-2" />
        Vincular Usuário
      </Button>
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!loading) setShowDialog(open);
        }}
      >
        <DialogContent className="w-[750px] max-w-[750px] mx-auto">
          <DialogHeader>
            <DialogTitle>Vincular Usuário</DialogTitle>
            <DialogDescription>
              Selecione um usuário para vincular a este parceiro:
            </DialogDescription>
          </DialogHeader>
          <div className="mb-3">
            <Input
              type="text"
              className="w-full px-3 py-2 border rounded text-sm"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={fetchingUsers}
            />
          </div>
          {fetchingUsers ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm pb-2">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-muted-foreground text-sm pb-2">
              Nenhum usuário disponível para vincular.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2 px-3 pb-1 text-xs font-semibold text-muted-foreground">
                <span className="col-span-4">Nome</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-2">Cargo</span>
                <span className="col-span-4">Email</span>
              </div>
              <div className="max-h-60 overflow-y-auto mb-4">
                {paginatedUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded hover:bg-accent ${
                      selectedUser?.id === u.id ? "bg-accent text-primary" : ""
                    }`}
                    onClick={() => setSelectedUser(u)}
                    disabled={loading}
                  >
                    <div className="grid grid-cols-12 items-center gap-2">
                      <span className="col-span-4 font-medium truncate">
                        {u.first_name} {u.last_name}
                      </span>
                      <span className="col-span-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            u.is_client
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-default text-default-foreground"
                          }`}
                        >
                          {u.is_client ? "Cliente" : "Administrativo"}
                        </span>
                      </span>
                      <span className="col-span-2">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {getRoleLabel(u.role, u.is_client)}
                        </span>
                      </span>
                      <span className="col-span-4 block text-xs text-muted-foreground truncate">
                        {u.email}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center px-3 pb-2">
                <span className="text-xs text-muted-foreground">
                  Página{" "}
                  {totalPages === 0 ? 0 : page + 1} de {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleLink}
              disabled={loading || !selectedUser}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
