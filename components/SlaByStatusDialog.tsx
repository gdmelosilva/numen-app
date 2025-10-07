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
import { SlaRule } from "@/types/sla_rules";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ApiSlaRule {
  project_id: string;
  ticket_category_id: number;
  priority_id: number;
  status_id: number;
  weekday_id: number;
  sla_hours: number;
  warning: boolean;
}

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
  projectId,
  weekdayId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (regras: ApiSlaRule[]) => Promise<void> | void;
  selectedDay?: string;
  projectId?: string;
  weekdayId?: number;
}) {
  // Buscar status e prioridades
  const { statuses } = useTicketStatuses();
  const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Regra[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [allDataReady, setAllDataReady] = useState(false);

  // Carregar prioridades e categorias
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        setDataLoaded(false);
        setRulesLoaded(false);
        setAllDataReady(false);
        
        const [priorityOptions, categoryOptions] = await Promise.all([
          getPriorityOptions(),
          getCategoryOptions(true) // true para AMS
        ]);
        
        setPriorities(priorityOptions);
        setCategories(categoryOptions);
        setDataLoaded(true);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    if (open) {
      loadData();
    }
  }, [open]);

  // Carregar dados existentes do servidor (após carregar categorias/prioridades)
  useEffect(() => {
    const loadExistingRules = async () => {
      if (!projectId || weekdayId === undefined || !open || !dataLoaded) return;
      
      try {
        const params = new URLSearchParams({
          project_id: projectId,
          weekday_id: weekdayId.toString()
        });
        
        const response = await fetch(`/api/sla-rules?${params}`);
        if (!response.ok) throw new Error('Erro ao carregar regras');
        
        const { data: existingRules } = await response.json();
        
        if (existingRules && existingRules.length > 0) {
          // Converter dados do servidor para formato do componente
          const convertedRows: Regra[] = existingRules.map((rule: SlaRule) => ({
            ticket_category_id: rule.ticket_category_id?.toString() || '',
            groupId: rule.status_id || 0,
            priority_id: rule.priority_id?.toString() || '',
            sla_hours: rule.sla_hours || 8,
            warning: rule.warning || false,
          }));
          
          setRows(convertedRows);
          
          // Definir categoria baseada nos dados carregados - primeira categoria encontrada
          if (convertedRows.length > 0 && !selectedCategory) {
            const firstCategoryId = convertedRows[0].ticket_category_id;
            setSelectedCategory(firstCategoryId);
          }
        } else {
          setRows([]);
        }
      } catch {
        // Erro silencioso - pode ser tratado pela UI se necessário
      } finally {
        setRulesLoaded(true);
        setLoading(false);
        // Marcar que todos os dados estão prontos
        setAllDataReady(true);
      }
    };
    
    loadExistingRules();
  }, [open, projectId, weekdayId, dataLoaded]);

  // Definir categoria inicial - apenas como fallback se não há dados carregados
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory && allDataReady) {
      if (rows.length > 0) {
        // Se há dados carregados, usar a primeira categoria dos dados
        const firstCategoryId = rows[0].ticket_category_id;
        setSelectedCategory(firstCategoryId);
      } else {
        // Se não há dados, usar a primeira categoria disponível
        const firstAvailableCategory = categories[0].id.toString();
        setSelectedCategory(firstAvailableCategory);
      }
    }
  }, [categories, rows, selectedCategory, allDataReady]);

  // Atualizar grupos selecionados quando trocar de categoria
  useEffect(() => {
    if (selectedCategory) {
      const existingGroups = rows
        .filter(r => r.ticket_category_id === selectedCategory)
        .map(r => r.groupId);
      
      setSelectedGroupIds(existingGroups);
    } else {
      setSelectedGroupIds([]);
    }
  }, [selectedCategory, rows]);

  // Reset estados quando fechar
  useEffect(() => {
    if (!open) {
      setSelectedGroupIds([]);
      setRows([]);
      setSelectedCategory("");
      setDataLoaded(false);
      setRulesLoaded(false);
      setAllDataReady(false);
      setLoading(true);
    }
  }, [open]);

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
    if (checked) {
      // Adicionar grupo e criar nova row
      setSelectedGroupIds(prev => [...prev, groupId]);
      
      if (selectedCategory && priorities.length > 0) {
        const defaultPriority = priorities[0];
        const newRow: Regra = {
          ticket_category_id: selectedCategory,
          groupId,
          priority_id: defaultPriority?.id.toString() || '',
          sla_hours: defaultPriority ? getDefaultTempo(defaultPriority.name) : 8,
          warning: false,
        };
        setRows(prev => [...prev, newRow]);
      }
    } else {
      // Remover grupo e row correspondente
      setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
      setRows(prev => prev.filter(r => !(r.ticket_category_id === selectedCategory && r.groupId === groupId)));
    }
  };

  const updateRow = (idx: number, patch: Partial<Regra>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      // Auto-default tempo quando priority muda
      if (patch.priority_id) {
        const priority = priorities.find(p => p.id.toString() === patch.priority_id);
        if (priority) {
          copy[idx].sla_hours = getDefaultTempo(priority.name);
        }
      }
      return copy;
    });
  };

  const removeRow = (idx: number) => {
    const r = rows[idx];
    if (r.ticket_category_id === selectedCategory) {
      setSelectedGroupIds(prev => prev.filter(id => id !== r.groupId));
    }
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  // Handler para mudança de categoria
  const handleCategoryChange = (newCategoryId: string) => {
    // Só permitir mudança se os dados estão carregados
    if (!allDataReady) return;
    
    setSelectedCategory(newCategoryId);
    
    // Os grupos selecionados serão atualizados automaticamente pelo useEffect
    // que observa mudanças em selectedCategory e rows
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
    
    // Converter para formato da API antes de salvar
    const apiFormatRules = rows.map(r => ({
      project_id: projectId!,
      ticket_category_id: parseInt(r.ticket_category_id),
      priority_id: parseInt(r.priority_id),
      status_id: r.groupId,
      weekday_id: weekdayId!,
      sla_hours: r.sla_hours,
      warning: r.warning
    }));
    
    await onSave(apiFormatRules);
    onOpenChange(false);
  };

  if (loading || !dataLoaded || !rulesLoaded || !allDataReady) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Carregando Regras SLA</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
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

  // Aguardar categoria ser definida antes de renderizar conteúdo
  if (!selectedCategory && allDataReady) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preparando Interface</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
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
            <Select 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
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
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
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
