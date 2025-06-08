"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import CreateRole from "@/components/create-role";
import { exportToCSV } from "@/lib/export-file";
import { Loader2 } from "lucide-react";
import { getRoleOptions } from "@/hooks/useOptions";
import { Role } from "@/types/roles";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getRoleOptions();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Remove filter logic: always show all roles
  const filteredRoles = roles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestão de Cargos</h2>
          <p className="text-sm text-muted-foreground">
            Administração de Cargos do Sistema
          </p>
        </div>
        <div className="flex gap-2">
          {/* Remove search button */}
          <CreateRole />
          <Button
            variant="secondary"
            onClick={() => exportToCSV(filteredRoles, "cargos.csv")}
            disabled={filteredRoles.length === 0}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchRoles} className="mt-4">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} data={filteredRoles} />
      )}
    </div>
  );
}