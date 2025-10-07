import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { getPriorityOptions, getCategoryOptions } from "@/hooks/useOptions";
import { ColoredBadge } from "@/components/ui/colored-badge";

interface Regra {
  ticket_category_id: string;
  groupId: number;
  priority_id: string;
  sla_hours: number;
  warning: boolean;
}

// Mapeamento dos grupos
const GROUP_LABELS: Record<number, string> = {
  1: "Aguardando Alocação",
  2: "Em Atuação",
  3: "Aguardando Cliente",
  4: "Em Desenvolvimento",
};

// Tempo padrão baseado no nome da prioridade (fallback)
const getDefaultTempo = (priorityName: string) => {
  const name = priorityName.toLowerCase();
  if (name.includes('crítica') || name.includes('critica')) return 2;
  if (name.includes('alto') || name.includes('alta')) return 4;
  if (name.includes('médio') || name.includes('medio')) return 8;
  if (name.includes('baixo') || name.includes('baixa')) return 24;
  return 8; // padrão
};

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
  // Buscar status e prioridades
  const { statuses } = useTicketStatuses();
  const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Regra[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Carregar prioridades e categorias
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [priorityOptions, categoryOptions] = await Promise.all([
          getPriorityOptions(),
          getCategoryOptions(true) // true para AMS
        ]);
        
        setPriorities(priorityOptions);
        setCategories(categoryOptions);
        
        // Definir a primeira categoria como selecionada
        if (categoryOptions.length > 0 && !selectedCategory) {
          setSelectedCategory(categoryOptions[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      loadData();
    }
  }, [open, selectedCategory]);

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

  // Add/remove group - versão simples
  const toggleGroup = (groupId: number, checked: boolean) => {
    setSelectedGroupIds(prev => {
      if (checked) {
        return [...prev, groupId];
      } else {
        return prev.filter(id => id !== groupId);
      }
    });
  };

  // Keep rows in sync with selectedGroupIds - versão simples
  useEffect(() => {
    if (!selectedCategory || priorities.length === 0) return;
    
    setRows(prev => {
      // Manter rows existentes da categoria atual que ainda estão selecionadas
      const existingRows = prev.filter(r => 
        r.ticket_category_id === selectedCategory && selectedGroupIds.includes(r.groupId)
      );
      
      // Adicionar novas rows para grupos que não existem
      const neededGroups = selectedGroupIds.filter(groupId => 
        !existingRows.some(r => r.groupId === groupId)
      );
      
      const newRows = neededGroups.map<Regra>(groupId => {
        const defaultPriority = priorities[0];
        return {
          ticket_category_id: selectedCategory,
          groupId,
          priority_id: defaultPriority?.id || '',
          sla_hours: defaultPriority ? getDefaultTempo(defaultPriority.name) : 8,
          warning: false,
        };
      });
      
      // Manter rows de outras categorias
      const otherCategoryRows = prev.filter(r => r.ticket_category_id !== selectedCategory);
      
      return [...otherCategoryRows, ...existingRows, ...newRows];
    });
  }, [selectedGroupIds, selectedCategory, priorities]);

  // Limpar grupos selecionados ao trocar categoria
  useEffect(() => {
    if (selectedCategory) {
      // Obter grupos já existentes para esta categoria
      const existingGroups = rows
        .filter(r => r.ticket_category_id === selectedCategory)
        .map(r => r.groupId);
      setSelectedGroupIds(existingGroups);
    }
  }, [selectedCategory]);

  const updateRow = (idx: number, patch: Partial<Regra>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      // Auto-default tempo quando priority muda
      if (patch.priority_id) {
        const priority = priorities.find(p => p.id === patch.priority_id);
        if (priority) {
          copy[idx].sla_hours = getDefaultTempo(priority.name);
        }
      }
      return copy;
    });
  };

  const removeRow = (idx: number) => {
    const r = rows[idx];
    setSelectedGroupIds(prev => prev.filter(id => id !== r.groupId));
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Obter regras da categoria ativa
  const getCurrentCategoryRows = (categoryId: string) => {
    return rows
      .filter(r => r.ticket_category_id === categoryId)
      .map((r) => ({ i: rows.indexOf(r), r }));
  };

  const handleSave = async () => {
    // Validação simples
    for (const r of rows) {
      if (!r.sla_hours || r.sla_hours <= 0) {
        throw new Error("Tempo de retorno deve ser maior que zero.");
      }
      if (!r.priority_id) {
        throw new Error("Prioridade deve ser selecionada.");
      }
    }
    await onSave(rows);
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Carregando categorias e prioridades...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (categories.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nenhuma categoria encontrada</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Nenhuma categoria de ticket AMS foi encontrada.
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentRows = getCurrentCategoryRows(selectedCategory);
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {selectedDay ? `${selectedDay} - Regras por Categoria` : "Regras por Categoria"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de Categoria */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Controles e Badges */}
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
              {priorities.map(p => (
                <ColoredBadge 
                  key={p.id} 
                  value={p.name} 
                  type="priority" 
                />
              ))}
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            {/* Header fixo */}
            <div className="grid grid-cols-12 px-3 py-2 text-xs text-muted-foreground bg-muted/50">
              <div className="col-span-4">Status</div>
              <div className="col-span-3">Prioridade</div>
              <div className="col-span-3">Tempo SLA (h)</div>
              <div className="col-span-1">Notificar</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            
            {/* Área com scroll */}
            <div className="divide-y max-h-96 overflow-y-auto">
              {currentRows.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  Nenhum grupo selecionado para “{selectedCategoryName}”. Use “Adicionar grupo”.
                </div>
              )}
              {currentRows.map(({ i, r }) => (
                <div key={`${r.ticket_category_id}-${r.groupId}`} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                  <div className="col-span-4 text-sm truncate">
                    {GROUP_LABELS[r.groupId] || `Grupo ${r.groupId}`}
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={r.priority_id}
                      onValueChange={(v) => updateRow(i, { priority_id: v })}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={1}
                      className="h-8"
                      value={r.sla_hours}
                      onChange={(e) => updateRow(i, { sla_hours: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox
                      checked={r.warning}
                      onCheckedChange={(v) => updateRow(i, { warning: Boolean(v) })}
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
