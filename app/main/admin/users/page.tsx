"use client";

import { useEffect, useState } from "react";
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

interface Filters {
  search: string;
  active: boolean | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    active: null,
  });
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      
      if (filters.active !== null) {
        queryParams.append("active", filters.active.toString());
      }

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

  useEffect(() => {
    fetchUsers();
  }, [filters]);

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
        <DataTable columns={columns} data={users} />
      )}
    </div>
  );
}