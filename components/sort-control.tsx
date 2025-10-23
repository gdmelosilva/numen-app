"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface SortOption {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}

interface SortControlProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  disabled?: boolean;
}

const SORT_OPTIONS = [
  { field: 'created_at', label: 'Data de Criação', defaultDirection: 'desc' },
  { field: 'updated_at', label: 'Última Atualização', defaultDirection: 'desc' },
  { field: 'external_id', label: 'ID do Chamado', defaultDirection: 'asc' },
  { field: 'title', label: 'Título', defaultDirection: 'asc' },
  { field: 'priority_id', label: 'Prioridade', defaultDirection: 'desc' },
  { field: 'status_id', label: 'Status', defaultDirection: 'asc' },
  { field: 'planned_end_date', label: 'Previsão de Fim', defaultDirection: 'asc' },
  { field: 'partner_id', label: 'Parceiro', defaultDirection: 'asc' },
  { field: 'project_id', label: 'Projeto', defaultDirection: 'asc' },
] as const;

export function SortControl({ currentSort, onSortChange, disabled = false }: SortControlProps) {
  const handleFieldChange = (field: string) => {
    const option = SORT_OPTIONS.find(opt => opt.field === field);
    if (option) {
      onSortChange({
        field,
        label: option.label,
        direction: option.defaultDirection,
      });
    }
  };

  const handleDirectionToggle = () => {
    onSortChange({
      ...currentSort,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const directionIcon = currentSort.direction === 'asc' ? 
    <ArrowUp className="h-4 w-4" /> : 
    <ArrowDown className="h-4 w-4" />;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
      <Select
        value={currentSort.field}
        onValueChange={handleFieldChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.field} value={option.field}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        disabled={disabled}
        className="px-3"
        title={`Ordenação ${currentSort.direction === 'asc' ? 'crescente' : 'decrescente'}`}
      >
        {directionIcon}
      </Button>
    </div>
  );
}