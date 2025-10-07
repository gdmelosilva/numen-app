import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { ColoredBadge } from "@/components/ui/colored-badge";

type Priority = "critico" | "alto" | "medio" | "baixo";

interface Regra {
  groupId: number;
  priority: Priority;
  tempoRetornoHoras: number;
  sinalizacao: boolean;
}

// Mapeamento de priority para tipos do ColoredBadge
const PRIORITY_TO_LABEL: Record<Priority, string> = {
  critico: "Crítica",
  alto: "Alta", 
  medio: "Média",
  baixo: "Baixa",
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "critico", label: "Crítico" },
  { value: "alto", label: "Alto" },
  { value: "medio", label: "Médio" },
  { value: "baixo", label: "Baixo" },
];

const DEFAULTS: Record<Priority, number> = {
  critico: 2,
  alto: 4,
  medio: 8,
  baixo: 24,
};

// Mapeamento dos grupos
const GROUP_LABELS: Record<number, string> = {
  1: "Aguardando Alocação",
  2: "Em Atuação",
  3: "Aguardando Cliente",
  4: "Em Desenvolvimento",
};

function getDefaultTempo(p: Priority) {
  return DEFAULTS[p] ?? 8;
}

export function SlaByStatusDialog({
  open,
  onOpenChange,
  onSave,
  selectedDay,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (regras: Regra[]) => Promise<void> | void;
  selectedDay?: string;
}) {
  // Buscar apenas status internos (padrão)
  const { statuses } = useTicketStatuses();
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Regra[]>([]);

  // Obter grupos únicos dos status
  const availableGroups = useMemo(() => {
    const groupsSet = new Set(statuses.map(s => s.group));
    return Array.from(groupsSet)
      .sort((a, b) => a - b)
      .map(groupId => ({
        id: groupId,
        label: GROUP_LABELS[groupId] || `Grupo ${groupId}`
      }));
  }, [statuses]);

  // Add/remove group
  const toggleGroup = (groupId: number, checked: boolean) => {
    setSelectedGroupIds(prev => {
      const cur = new Set(prev);
      if (checked) cur.add(groupId); else cur.delete(groupId);
      return Array.from(cur);
    });
  };

  // Keep rows in sync with selectedGroupIds
  useEffect(() => {
    setRows(prev => {
      const keep = prev.filter(r => selectedGroupIds.includes(r.groupId));
      const needed = selectedGroupIds
        .filter(groupId => !keep.some(r => r.groupId === groupId))
        .map<Regra>(groupId => ({
          groupId,
          priority: "medio",
          tempoRetornoHoras: getDefaultTempo("medio"),
          sinalizacao: false,
        }));
      return [...keep, ...needed];
    });
  }, [selectedGroupIds]);

  const updateRow = (idx: number, patch: Partial<Regra>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      // Auto-default tempo quando priority muda
      if (patch.priority) {
        const tempo = getDefaultTempo(patch.priority);
        copy[idx].tempoRetornoHoras = tempo;
      }
      return copy;
    });
  };

  const removeRow = (idx: number) => {
    const r = rows[idx];
    setSelectedGroupIds(prev => prev.filter(id => id !== r.groupId));
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const currentRows = rows.map((r, i) => ({ i, r }));

  const handleSave = async () => {
    // Validação simples
    for (const { r } of currentRows) {
      if (!r.tempoRetornoHoras || r.tempoRetornoHoras <= 0) {
        throw new Error("Tempo de retorno deve ser maior que zero.");
      }
    }
    await onSave(rows);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {selectedDay ? `${selectedDay}` : "Regras por Status"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar grupo
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2">
                <div className="space-y-2">
                  {availableGroups.map((group) => {
                    const checked = selectedGroupIds.includes(group.id);
                    return (
                      <label key={group.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleGroup(group.id, Boolean(v))}
                        />
                        <span className="text-sm">{group.label}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <ColoredBadge 
                  key={p.value} 
                  value={PRIORITY_TO_LABEL[p.value]} 
                  type="priority" 
                />
              ))}
            </div>
          </div>

          <div className="rounded-md border">
            {/* Header fixo */}
            <div className="grid grid-cols-12 px-3 py-2 text-xs text-muted-foreground bg-muted/50">
              <div className="col-span-4">Status</div>
              <div className="col-span-3">Prioridade</div>
              <div className="col-span-3">Tempo Retorno (h)</div>
              <div className="col-span-1">Sinalização</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            
            {/* Área com scroll */}
            <div className="divide-y max-h-96 overflow-y-auto">
              {currentRows.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  Nenhum grupo selecionado. Use &quot;Adicionar grupo&quot;.
                </div>
              )}
              {currentRows.map(({ i, r }) => (
                <div key={r.groupId} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                  <div className="col-span-4 text-sm truncate">
                    {GROUP_LABELS[r.groupId] || `Grupo ${r.groupId}`}
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={r.priority}
                      onValueChange={(v) => updateRow(i, { priority: v as Priority })}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={1}
                      className="h-8"
                      value={r.tempoRetornoHoras}
                      onChange={(e) => updateRow(i, { tempoRetornoHoras: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox
                      checked={r.sinalizacao}
                      onCheckedChange={(v) => updateRow(i, { sinalizacao: Boolean(v) })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeRow(i)} 
                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
