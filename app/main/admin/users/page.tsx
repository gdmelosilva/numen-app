"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns, User } from "./columns";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/components/UserCreateDialog";
import { exportToCSV } from "@/lib/export-file";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { getRoleOptions } from "@/hooks/useOptions";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { UserEditDialog } from "@/components/UserEditDialog";

interface Filters {
  search: string;
  active: boolean | null;
  email: string;
  tel_contact: string;
  partner_desc: string;
  role: string;
  is_client: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    active: null,
    email: "",
    tel_contact: "",
    partner_desc: "",
    role: "",
    is_client: "",
    created_at: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleOptionsLoaded, setRoleOptionsLoaded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.active !== null && filters.active !== undefined)
        queryParams.append("active", filters.active.toString());
      if (filters.email) queryParams.append("email", filters.email);
      if (filters.tel_contact) queryParams.append("tel_contact", filters.tel_contact);
      if (filters.partner_desc) queryParams.append("partner_desc", filters.partner_desc);
      if (filters.role) queryParams.append("role", filters.role);
      if (filters.is_client) queryParams.append("is_client", filters.is_client);
      if (filters.created_at) queryParams.append("created_at", filters.created_at);
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar usuários");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = () => {
    setFilters(prev => {
      const newFilters = { ...prev, search: searchInput };
      fetchUsersWithFilters(newFilters);
      return newFilters;
    });
  };

  const fetchUsersWithFilters = async (customFilters: Filters) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (customFilters.search) queryParams.append("search", customFilters.search);
      if (customFilters.active !== null && customFilters.active !== undefined)
        queryParams.append("active", customFilters.active.toString());
      if (customFilters.email) queryParams.append("email", customFilters.email);
      if (customFilters.tel_contact) queryParams.append("tel_contact", customFilters.tel_contact);
      if (customFilters.partner_desc) queryParams.append("partner_desc", customFilters.partner_desc);
      if (customFilters.role) queryParams.append("role", customFilters.role);
      if (customFilters.is_client) queryParams.append("is_client", customFilters.is_client);
      if (customFilters.created_at) queryParams.append("created_at", customFilters.created_at);
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar usuários");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRoleSelectOpen = async (open: boolean) => {
    if (open && !roleOptionsLoaded) {
      const roles = await getRoleOptions();
      setRoleOptions(roles.map((role) => ({ label: role.title, value: String(role.id) })));
      setRoleOptionsLoaded(true);
    }
  };

  // Handler to close edit dialog
  const handleCloseEditDialog = () => {
    setEditUser(null);
    setIsEditDialogOpen(false);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Usuários</h2>
          <p className="text-sm text-muted-foreground">Administração de Usuários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="colored2" onClick={handleSearch} disabled={loading || isEditDialogOpen}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <UserCreateDialog onSuccess={fetchUsers} disabled={isEditDialogOpen} />
          <Button
            variant="secondary"
            onClick={() => exportToCSV(users.map(u => ({ ...u })) as Record<string, unknown>[], "usuarios.csv")}
            disabled={users.length === 0 || isEditDialogOpen}
            className="bg-accent text-white"
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Filtrar por email"
                value={filters.email}
                onChange={e => handleFilterChange("email", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel_contact">Telefone</Label>
              <Input
                id="tel_contact"
                placeholder="Filtrar por telefone"
                value={filters.tel_contact}
                onChange={e => handleFilterChange("tel_contact", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_desc">Parceiro</Label>
              <Input
                id="partner_desc"
                placeholder="Filtrar por parceiro"
                value={filters.partner_desc}
                onChange={e => handleFilterChange("partner_desc", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={filters.role || "all"}
                onValueChange={value => handleFilterChange("role", value === "all" ? "" : value)}
                disabled={isEditDialogOpen}
                onOpenChange={handleRoleSelectOpen}
              >
                <SelectTrigger id="role" disabled={isEditDialogOpen}>
                  <SelectValue placeholder="Todas as funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {roleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_client">Tipo</Label>
              <Select
                value={filters.is_client || "all"}
                onValueChange={value => handleFilterChange("is_client", value === "all" ? "" : value)}
                disabled={isEditDialogOpen}
              >
                <SelectTrigger id="is_client" disabled={isEditDialogOpen}>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Cliente</SelectItem>
                  <SelectItem value="false">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select
                value={filters.active === null ? "all" : filters.active ? "true" : "false"}
                onValueChange={value => {
                  handleFilterChange("active", value === "all" ? null : value === "true");
                }}
                disabled={isEditDialogOpen}
              >
                <SelectTrigger id="active" disabled={isEditDialogOpen}>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchUsers} className="mt-4" disabled={isEditDialogOpen}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          meta={{
            onEditOpen: () => setIsEditDialogOpen(true),
            onEditClose: () => setIsEditDialogOpen(false),
          }}
        />
      )}

      {editUser && isEditDialogOpen && (
        <UserEditDialog user={editUser} onSuccess={handleCloseEditDialog} />
      )}
    </div>
  );
}