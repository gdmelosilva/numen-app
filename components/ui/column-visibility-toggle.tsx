import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { Table } from "@tanstack/react-table";
import React from "react";

interface ColumnVisibilityToggleProps<TData> {
  table: Table<TData>;
  columnLabels?: Record<string, string>;
}

export function ColumnVisibilityToggle<TData>({
  table,
  columnLabels = {},
}: ColumnVisibilityToggleProps<TData>) {
  const [open, setOpen] = useState(false);

  // Get all columns that can be hidden (exclude actions and selection columns)
  const toggleableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() &&
        column.id !== "actions" &&
        column.id !== "select" &&
        column.id !== "expand"
    );

  const getColumnLabel = (columnId: string): string => {
    // Use custom label if provided
    if (columnLabels[columnId]) {
      return columnLabels[columnId];
    }

    // Direct mappings based on the exact titles from columns.tsx
    const columnTitles: Record<string, string> = {
      'is_private': 'Privado?',
      'external_id': 'ID',
      'project.projectName': 'Contrato',
      'partner.partner_desc': 'Parceiro',
      'category.name': 'Categoria',
      'title': 'Título',
      'module.name': 'Módulo',
      'status.name': 'Status',
      'created_at': 'Criado em',
      'priority.name': 'Prioridade',
      'planned_end_date': 'Prev. Fim',
      'resources': 'Recursos',
    };

    // Return the mapped title or fallback to formatted columnId
    return columnTitles[columnId] || columnId
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8"
          title="Configurar colunas visíveis"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-2">
          {toggleableColumns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={() => column.toggleVisibility()}
              />
              <label
                htmlFor={column.id}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {getColumnLabel(column.id)}
              </label>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Reset to show all columns
              toggleableColumns.forEach((column) => {
                column.toggleVisibility(true);
              });
            }}
          >
            Mostrar Todas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
