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
      // Smartcare Management columns with exact titles from DataTableColumnHeader
      'open_ticket': 'Abrir',
      'is_private': 'Privado?',
      'external_id': 'Id. Chamado',
      'ref_external_id': 'Ref. Externa',
      'project': 'Projeto',
      'partner': 'Parceiro',
      'category': 'Categoria',
      'title': 'Título',
      'module': 'Módulo Func.',
      'status': 'Status',
      'created_at': 'Criado em',
      'created_by': 'Criado Por',
      'priority': 'Prioridade',
      'planned_end_date': 'Prev. Fim',
      'main_resource': 'Recurso Principal',
      'other_resources': 'Demais Recursos',
      'resources': 'Recursos Aloc.',
      
      // Project Tickets Tab columns
      'priority_id': 'Prioridade',
      'type_id': 'Categoria',
      'module_id': 'Módulo - Torre',
      'is_closed': 'Fechado?',
      
      // Legacy support for dot notation (fallback)
      'project.projectName': 'Projeto',
      'partner.partner_desc': 'Parceiro',
      'category.name': 'Categoria',
      'module.name': 'Módulo Func.',
      'status.name': 'Status',
      'priority.name': 'Prioridade',
      
      // Common columns across different tables
      'projectName': 'Nome do Projeto',
      'projectDesc': 'Descrição do Projeto',
      'is_active': 'Ativo',
      'first_name': 'Nome',
      'last_name': 'Sobrenome',
      'email': 'E-mail',
      'role': 'Perfil',
      'name': 'Nome',
      'description': 'Descrição',
      'updated_at': 'Atualizado em',
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
