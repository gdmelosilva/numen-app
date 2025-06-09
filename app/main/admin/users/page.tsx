"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns, User } from "./columns";
import { Button } from "@/components/ui/button";
import { UserCreateDialog } from "@/components/UserCreateDialog";
import { exportToCSV } from "@/lib/export-file";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
<<<<<<< HEAD
import { getRoleOptions } from "@/hooks/useOptions";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface Filters {
  search: string;
  active: boolean | null;
  email: string;
  tel_contact: string;
  partner_desc: string;
  role: string;
  is_client: string;
  created_at: string;
=======

interface Filters {
  search: string;
  active: boolean | null ;
>>>>>>> parent of 1d000e1 (Enhance user filtering options in admin panel and update dependencies)
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    active: null,
<<<<<<< HEAD
    email: "",
    tel_contact: "",
    partner_desc: "",
    role: "",
    is_client: "",
    created_at: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [, setPartners] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getRoleOptions().then((roles) => {
      setRoleOptions(
        roles.map((role) => ({ label: role.title, value: String(role.id) }))
      );
    });
  }, []);
=======
  });
  const [searchInput, setSearchInput] = useState("");
>>>>>>> parent of 1d000e1 (Enhance user filtering options in admin panel and update dependencies)

  useEffect(() => {
    fetch('/api/partners')
      .then(res => res.json())
      .then((data: { id: string; partner_desc: string }[]) => {
        if (Array.isArray(data)) setPartners(data.map((p) => ({ id: String(p.id), name: p.partner_desc })));
      });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      
      if (filters.active !== null && filters.active !== undefined) {
        queryParams.append("active", filters.active.toString());
<<<<<<< HEAD
      if (filters.email) queryParams.append("email", filters.email);
      if (filters.tel_contact) queryParams.append("tel_contact", filters.tel_contact);
      if (filters.partner_desc) queryParams.append("partner_desc", filters.partner_desc);
      if (filters.role) queryParams.append("role", filters.role);
      if (filters.is_client) queryParams.append("is_client", filters.is_client);
      if (filters.created_at) queryParams.append("created_at", filters.created_at);
=======
      }
>>>>>>> parent of 1d000e1 (Enhance user filtering options in admin panel and update dependencies)
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Usuários</h2>
          <p className="text-sm text-muted-foreground">Administração de Usuários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <UserCreateDialog onSuccess={fetchUsers} />
          <Button
            variant="secondary"
            onClick={() => exportToCSV(users, "usuarios.csv")}
            disabled={users.length === 0}
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
              />
            </div>
            <div className="space-y-2">
<<<<<<< HEAD
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Filtrar por email"
                value={filters.email}
                onChange={e => handleFilterChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel_contact">Telefone</Label>
              <Input
                id="tel_contact"
                placeholder="Filtrar por telefone"
                value={filters.tel_contact}
                onChange={e => handleFilterChange("tel_contact", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_desc">Parceiro</Label>
              <Input
              id="partner_desc"
              placeholder="Filtrar por parceiro"
              value={filters.partner_desc}
              onChange={e => handleFilterChange("partner_desc", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={filters.role || "all"}
                onValueChange={value => handleFilterChange("role", value === "all" ? "" : value)}
              >
                <SelectTrigger id="role">
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
              >
                <SelectTrigger id="is_client">
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
                  setFilters(prev => ({ ...prev, active: value === "all" ? null : value === "true" }));
                }}
              >
                <SelectTrigger id="active">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
=======
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={filters.active === true}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({ ...prev, active: checked }));
                  }}
                />
                <Label htmlFor="active">Ativos</Label>
                <Switch
                  id="inactive"
                  checked={filters.active === false}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({ ...prev, active: checked ? false : null }));
                  }}
                />
                <Label htmlFor="inactive">Inativos</Label>
              </div>
>>>>>>> parent of 1d000e1 (Enhance user filtering options in admin panel and update dependencies)
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
            <Button onClick={fetchUsers} className="mt-4">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns.map(col =>
          'accessorKey' in col && col.accessorKey === 'partner_id'
            ? {
                ...col,
                header: () => <span>Parceiro</span>,
                cell: ({ row }: { row: { original: User } }) => (row.original.partner_desc ?? '-'),
              }
            : col
        )} data={users} />
      )}
    </div>
  );
}