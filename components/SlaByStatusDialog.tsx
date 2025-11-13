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
import { ButtonSpinner } from "@/components/ui/button-spinner";

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
  id?: number; // ID da regra SLA existente (para deletar)
  ticket_category_id: string;
  groupId: number;
  sla_hours_by_priority: { [priorityId: string]: string | number };
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
// const getDefaultTempo = (priorityName: string) => {
//   const name = priorityName.toLowerCase();
//   if (name.includes('crítica') || name.includes('critica')) return '';
//   if (name.includes('alto') || name.includes('alta')) return '';
//   if (name.includes('médio') || name.includes('media')) return '';
//   if (name.includes('baixo') || name.includes('baixa')) return '';
//   return 8; // padrão
// };

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
  const [saving, setSaving] = useState(false);

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
          // Agrupar por categoria e grupo, e mapear horas por prioridade
          const grouped: { [key: string]: Regra } = {};
          existingRules.forEach((rule: SlaRule) => {
            const key = `${rule.ticket_category_id}-${rule.status_id}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: undefined,
                ticket_category_id: rule.ticket_category_id?.toString() || '',
                groupId: rule.status_id || 0,
                sla_hours_by_priority: {},
                warning: rule.warning || false,
              };
            }
            grouped[key].sla_hours_by_priority[rule.priority_id?.toString() || ''] = rule.sla_hours || 8;
          });
          const convertedRows: Regra[] = Object.values(grouped);
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
  }, [open, projectId, weekdayId, dataLoaded]); // Remover selectedCategory para evitar loops

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
      setSaving(false);
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
        const sla_hours_by_priority: { [priorityId: string]: string | number } = {};
        priorities.forEach(p => {
          sla_hours_by_priority[p.id] = '';
        });
        const newRow: Regra = {
          ticket_category_id: selectedCategory,
          groupId,
          sla_hours_by_priority,
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
    if (saving) return; // Prevenir múltiplos cliques

    // Validação simples
    for (const r of rows) {
      for (const p of priorities) {
        const sla = r.sla_hours_by_priority[p.id];
        if (sla === '' || sla === undefined || sla === null) {
          // Permitir vazio, não enviar
          continue;
        }
        if (typeof sla === 'number' && sla <= 0) {
          throw new Error(`Tempo de retorno deve ser maior que zero para prioridade ${p.name}.`);
        }
      }
    }

    setSaving(true);

    try {
      // 1. Primeiro, buscar todas as regras existentes para este projeto/dia
      const params = new URLSearchParams({
        project_id: projectId!,
        weekday_id: weekdayId!.toString()
      });

      const existingResponse = await fetch(`/api/sla-rules?${params}`);
      const { data: existingRules = [] } = existingResponse.ok ? await existingResponse.json() : { data: [] };

      // 2. Identificar regras que foram removidas (existem no banco mas não estão nos rows atuais)
      const currentRuleIds = rows.filter(r => r.id).map(r => r.id);
      const rulesToDelete = existingRules.filter((rule: SlaRule) => 
        rule.project_id === projectId &&
        rule.weekday_id === weekdayId &&
        !currentRuleIds.includes(rule.id)
      );

      // 3. Deletar regras removidas
      const deletePromises = rulesToDelete.map(async (rule: SlaRule) => {
        const response = await fetch(`/api/sla-rules/${rule.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao deletar regra SLA');
        }
      });

      // 4. Converter regras atuais para formato da API
      const apiFormatRules: ApiSlaRule[] = [];
      rows.forEach(r => {
        priorities.forEach(p => {
          const sla = r.sla_hours_by_priority[p.id];
          if (sla !== '' && sla !== undefined && sla !== null) {
            apiFormatRules.push({
              project_id: projectId!,
              ticket_category_id: parseInt(r.ticket_category_id),
              priority_id: parseInt(p.id),
              status_id: r.groupId,
              weekday_id: weekdayId!,
              sla_hours: typeof sla === 'string' ? Number(sla) : sla,
              warning: r.warning
            });
          }
        });
      });

      // 5. Aguardar exclusões e então chamar onSave com as regras formatadas
      await Promise.all(deletePromises);
      
      // Chamar o callback onSave passado pelo componente pai
      await onSave(apiFormatRules);

      onOpenChange(false);

    } catch (error) {
      throw error; // Re-throw para que o componente pai possa tratar
    } finally {
      setSaving(false);
    }
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
  // const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-5xl ">
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
              {/* Badges removidos daqui, agora estão no header da tabela */}
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            {/* Header fixo */}
            <div className={`grid px-3 py-2 text-xs text-muted-foreground bg-muted/50`} style={{ gridTemplateColumns: `220px repeat(${priorities.length}, 120px) 80px 60px` }}>
              <div className="flex items-center justify-center h-full text-center">Status</div>
              {priorities.map(p => (
                <div key={p.id} className="flex items-center justify-center h-full text-center">
                  <div className="flex items-center justify-center w-full h-full">
                    <ColoredBadge value={p.name} type="priority" />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center h-full text-center">Notificar</div>
              <div className="flex items-center justify-center h-full text-center">Ações</div>
            </div>
            {/* Área com scroll */}
            <div className="divide-y max-h-96 overflow-y-auto">
              {currentRows.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">
                  Nenhum grupo selecionado. Use “Adicionar grupo”.
                </div>
              )}
              {currentRows.map(({ i, r }) => (
                <div key={`${r.ticket_category_id}-${r.groupId}`} className="grid items-center gap-2 px-3 py-2" style={{ gridTemplateColumns: `220px repeat(${priorities.length}, 120px) 80px 60px` }}>
                  <div className="text-sm truncate flex items-center justify-center h-full">{GROUP_LABELS[r.groupId] || `Grupo ${r.groupId}`}</div>
                  {priorities.map(p => (
                    <div key={p.id} className="flex items-center justify-center h-full">
                      <Input
                        type="text"
                        inputMode="numeric"
                        min={1}
                        className="h-8 w-20 text-center"
                        value={r.sla_hours_by_priority[p.id] === '' ? '' : r.sla_hours_by_priority[p.id].toString()}
                        onChange={e => {
                          const raw = e.target.value;
                          // Accept only positive numbers or empty string
                          const value = raw === '' ? '' : (/^\d+$/.test(raw) ? Number(raw) : r.sla_hours_by_priority[p.id]);
                          updateRow(i, {
                            sla_hours_by_priority: {
                              ...r.sla_hours_by_priority,
                              [p.id]: value
                            }
                          });
                        }}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-center h-full">
                    <Checkbox
                      checked={r.warning}
                      onCheckedChange={(v) => updateRow(i, { warning: Boolean(v) })}
                    />
                  </div>
                  <div className="flex items-center justify-center h-full">
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
          <Button 
            variant="outline" 
            className="hover:bg-destructive hover:text-destructive-foreground" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <ButtonSpinner 
            onClick={handleSave}
            loading={saving}
          >
            Salvar
          </ButtonSpinner>
        </div>
      </DialogContent>
    </Dialog>
  );
}
