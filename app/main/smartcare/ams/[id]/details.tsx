import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CircleDollarSignIcon, Info, Pencil } from "lucide-react";
import type { Contract } from "@/types/contracts";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ProjectDetailsTabProps {
  project: Contract;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
}

export default function ProjectDetailsTab({ project, editMode, setEditMode }: ProjectDetailsTabProps) {
  const { user: currentUser } = useCurrentUser();
  
  // Determine if the project is closed (status 'Encerrado')
  const isClosed = (() => {
    let status = '';
    if (typeof project.project_status === 'object' && project.project_status !== null) {
      if ('name' in project.project_status && typeof project.project_status.name === 'string') {
        status = project.project_status.name;
      } else if ('label' in project.project_status && typeof project.project_status.label === 'string') {
        status = project.project_status.label;
      } else if ('id' in project.project_status && typeof project.project_status.id === 'string') {
        status = project.project_status.id;
      }
    } else if (typeof project.project_status === 'string') {
      status = project.project_status;
    }
    return status.trim().toLowerCase() === 'encerrado';
  })();
  
  // Check if user is client or manager - both cannot edit contracts
  const isClientUser = currentUser?.is_client === true;
  const isManagerUser = currentUser?.role === 2; // manager-adm
  const canEditContract = !isClientUser && !isManagerUser;
  const [form, setForm] = useState({
    projectName: project.projectName || "",
    projectDesc: project.projectDesc || "",
    start_date: project.start_date ? String(project.start_date).slice(0, 10) : "",
    end_at: project.end_at ? String(project.end_at).slice(0, 10) : "",
    project_type: project.project_type || "",
    project_status: (() => {
      if (typeof project.project_status === "object" && project.project_status !== null) {
        if ("id" in project.project_status) {
          return String(project.project_status.id || "");
        } else if ("name" in project.project_status) {
          // Busca o ID baseado no name
          return String(project.project_status.name || "");
        }
      }
      return typeof project.project_status === "string" ? project.project_status : "";
    })(),
    is_wildcard: project.is_wildcard || false,
    is_247: project.is_247 || false,
    hours_max: project.hours_max ?? "",
    cred_exp_period: project.cred_exp_period ?? "",
    value_hr_normal: project.value_hr_normal ?? "",
    value_hr_excdn: project.value_hr_excdn ?? "",
    value_hr_except: project.value_hr_except ?? "",
    value_hr_warn: project.value_hr_warn ?? "",
    baseline_hours: project.baseline_hours ?? "",
    opening_time: project.opening_time ?? "",
    closing_time: project.closing_time ?? "",
  });

  // Atualiza o form sempre que o project mudar
  useEffect(() => {
    const novoForm = {
      projectName: project.projectName || "",
      projectDesc: project.projectDesc || "",
      start_date: project.start_date ? String(project.start_date).slice(0, 10) : "",
      end_at: project.end_at ? String(project.end_at).slice(0, 10) : "",
      project_type: project.project_type || "",
      project_status: (() => {
        if (typeof project.project_status === "object" && project.project_status !== null) {
          if ("id" in project.project_status) {
            return String(project.project_status.id || "");
          } else if ("name" in project.project_status) {
            // Busca o ID baseado no name
            return String(project.project_status.name || "");
          }
        }
        return typeof project.project_status === "string" ? project.project_status : "";
      })(),
      is_wildcard: project.is_wildcard || false,
      is_247: project.is_247 || false,
      hours_max: project.hours_max ?? "",
      cred_exp_period: project.cred_exp_period ?? "",
      value_hr_normal: project.value_hr_normal ?? "",
      value_hr_excdn: project.value_hr_excdn ?? "",
      value_hr_except: project.value_hr_except ?? "",
      value_hr_warn: project.value_hr_warn ?? "",
      baseline_hours: project.baseline_hours ?? "",
      opening_time: project.opening_time ?? "",
      closing_time: project.closing_time ?? "",
    };
    setForm(novoForm);
  }, [project]);

  const [statusOptions, setStatusOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garante que o valor do status está sempre sincronizado com as opções
  useEffect(() => {
    if (statusOptions.length > 0 && form.project_status) {
      // Verifica se o status existe por ID ou por name
      const hasValidStatus = statusOptions.some(opt => 
        String(opt.id) === String(form.project_status) || 
        String(opt.name) === String(form.project_status)
      );
      if (!hasValidStatus) {
        setForm(f => ({ ...f, project_status: statusOptions[0].id }));
      }
    }
  }, [statusOptions, form.project_status]);

  useEffect(() => {
    // Fetch project status options
    fetch("/api/options?type=project_status")
      .then((res) => res.json())
      .then((data) => {
        setStatusOptions(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Erro ao carregar status:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Monta objeto apenas com campos alterados
      const changedFields: Record<string, unknown> = {};
      Object.entries(form).forEach(([key, value]) => {
        let originalValue = undefined;
        if (key in project) {
          originalValue = project[key as keyof typeof project];
        }
        // project_status pode ser objeto ou string
        if (key === "project_status") {
          if (typeof project.project_status === "object" && project.project_status !== null) {
            if ("id" in project.project_status) {
              originalValue = project.project_status.id;
            } else if ("name" in project.project_status) {
              originalValue = project.project_status.name;
            }
          } else {
            originalValue = project.project_status;
          }
        }
        // Lista de campos numéricos
        const numericFields = [
          "hours_max", "cred_exp_period", "value_hr_normal", "value_hr_excdn", "value_hr_except", "value_hr_warn", "baseline_hours"
        ];
        // Lista de campos de horário
        const timeFields = ["opening_time", "closing_time"];
        let sendValue = value;
        if (numericFields.includes(key)) {
          if (value === "" || value === undefined) {
            // Não adiciona o campo se vazio
            return;
          } else {
            sendValue = typeof value === "string" ? Number(value) : value;
            if (isNaN(sendValue as number)) return;
          }
        }
        if (timeFields.includes(key)) {
          if (value === "" || value === undefined) {
            // Não adiciona o campo se vazio
            return;
          }
        }
        // Normaliza datas para comparação
        if ((key === "start_date" || key === "end_at") && value && originalValue) {
          const v1 = String(value).slice(0, 10);
          const v2 = String(originalValue).slice(0, 10);
          if (v1 !== v2) changedFields[key] = sendValue;
        } else if (sendValue !== originalValue) {
          changedFields[key] = sendValue;
        }
      });
      // Sempre envie id, partnerId e updated_at
      changedFields.id = project.id;
      changedFields.partnerId = project.partnerId || project.partner?.id || null;
      changedFields.updated_at = new Date().toISOString();
      // Garante que todos os campos essenciais sejam enviados
      changedFields.start_date = form.start_date || (project.start_date ? String(project.start_date).slice(0, 10) : "");
      changedFields.end_at = form.end_at || (project.end_at ? String(project.end_at).slice(0, 10) : "");
      changedFields.projectName = form.projectName || project.projectName || "";
      changedFields.projectDesc = form.projectDesc || project.projectDesc || "";
      changedFields.partnerId = project.partnerId || (project.partner && project.partner.id) || "";
      changedFields.project_type = form.project_type || project.project_type || "";
      changedFields.is_wildcard = form.is_wildcard ?? project.is_wildcard ?? false;
      changedFields.is_247 = form.is_247 ?? project.is_247 ?? false;
      changedFields.project_status = form.project_status || (typeof project.project_status === "object" && project.project_status !== null && "id" in project.project_status ? project.project_status.id : project.project_status) || "";
      const response = await fetch("/api/admin/contracts/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedFields),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar projeto");
      }
      setEditMode(false);
      toast.success("Projeto atualizado com sucesso.");
      // Optionally: refetch project data here
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      projectName: project.projectName || "",
      projectDesc: project.projectDesc || "",
      start_date: project.start_date ? String(project.start_date).slice(0, 10) : "",
      end_at: project.end_at ? String(project.end_at).slice(0, 10) : "",
      project_type: project.project_type || "",
      project_status: (() => {
        if (typeof project.project_status === "object" && project.project_status !== null) {
          if ("id" in project.project_status) {
            return String(project.project_status.id || "");
          } else if ("name" in project.project_status) {
            return String(project.project_status.name || "");
          }
        }
        return typeof project.project_status === "string" ? project.project_status : "";
      })(),
      is_wildcard: project.is_wildcard || false,
      is_247: project.is_247 || false,
      hours_max: project.hours_max ?? "",
      cred_exp_period: project.cred_exp_period ?? "",
      value_hr_normal: project.value_hr_normal ?? "",
      value_hr_excdn: project.value_hr_excdn ?? "",
      value_hr_except: project.value_hr_except ?? "",
      value_hr_warn: project.value_hr_warn ?? "",
      baseline_hours: project.baseline_hours ?? "",
      opening_time: project.opening_time ?? "",
      closing_time: project.closing_time ?? "",
    });
    setEditMode(false);
    setError(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1 py-2">
        <h1 className="text-2xl font-bold truncate">{form.projectName || 'Projeto'}</h1>
        {editMode ? (
          <div className="flex gap-2">
            <Button size="sm" variant="colored2" type="button" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
          </div>
        ) : (
          // Hide edit button for client users and manager users
          canEditContract && (
            <Button size="sm" variant="outline" type="button" onClick={() => { if (!isClosed) setEditMode((v) => !v); }} disabled={isClosed}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
          )
        )}
      </div>
      {error && <div className="text-destructive px-1 pt-2">{error}</div>}
      {/* Cabeçalho para Informações do Contrato */}
      <Card className="mt-0">
        <div className="px-6 pb-4 pt-2">
          <h2 className="flex items-center text-lg font-semibold">
            <Info className="w-4 h-4 mr-2" /> Informações do Contrato
          </h2>
        </div>
        <CardContent className="pt-4">
          <form className="grid gap-6 md:grid-cols-3 lg:grid-cols-4" onSubmit={handleSave}>
            {/* Nome */}
            <div className="md:col-span-1">
              <Label htmlFor="projectName" className="text-xs text-muted-foreground">Nome</Label>
              <Input id="projectName" name="projectName" value={form.projectName} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Descrição */}
            <div className="md:col-span-2 lg:col-span-3">
              <Label htmlFor="projectDesc" className="text-xs text-muted-foreground">Descrição</Label>
              <Input id="projectDesc" name="projectDesc" value={form.projectDesc} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Parceiro */}
            <div>
              <Label className="text-xs text-muted-foreground">Parceiro</Label>
              <Input value={project.partner?.partner_desc || ''} disabled className="h-9" />
            </div>
            {/* Início */}
            <div>
              <Label htmlFor="start_date" className="text-xs text-muted-foreground">Início</Label>
              <Input id="start_date" name="start_date" type="date" value={form.start_date ? form.start_date.slice(0, 10) : ''} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Fim */}
            <div>
              <Label htmlFor="end_at" className="text-xs text-muted-foreground">Fim</Label>
              {form.end_at ? (
                <Input id="end_at" name="end_at" type="date" value={form.end_at.slice(0, 10)} className="h-9" disabled />
              ) : (
                <Input id="end_at" name="end_at" type="text" value="" placeholder="" className="h-9" disabled />
              )}
            </div>
            {/* Tipo */}
            <div>
              <Label htmlFor="project_type" className="text-xs text-muted-foreground">Tipo</Label>
              <Input id="project_type" name="project_type" value={form.project_type} onChange={handleChange} className="h-9" disabled />
            </div>
            {/* Status */}
            <div>
              <Label htmlFor="project_status" className="text-xs text-muted-foreground">Status</Label>
              {editMode ? (
                <Select
                  value={(() => {
                    // Busca por ID primeiro, depois por name
                    const byId = statusOptions.find(s => String(s.id) === String(form.project_status));
                    const byName = statusOptions.find(s => String(s.name) === String(form.project_status));
                    return byId ? String(byId.id) : byName ? String(byName.id) : "";
                  })()}
                  onValueChange={v => setForm(f => ({ ...f, project_status: v }))}
                  disabled={!editMode}
                >
                  <SelectTrigger className="h-9 w-full max-w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.id} value={String(status.id)}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  id="project_status" 
                  name="project_status" 
                  value={(() => {
                    // Busca por ID primeiro, depois por name, senão usa o valor direto
                    const byId = statusOptions.find(s => String(s.id) === String(form.project_status));
                    const byName = statusOptions.find(s => String(s.name) === String(form.project_status));
                    return byId?.name || byName?.name || String(form.project_status || "");
                  })()} 
                  className="h-9" 
                  disabled 
                />
              )}
            </div>
            {/* Horário de Abertura */}
            <div>
              <Label htmlFor="opening_time" className="text-xs text-muted-foreground">Horário de Abertura</Label>
              <Input id="opening_time" name="opening_time" type="time" value={form.opening_time || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Linha com Horário de Fechamento, Wildcard e 24/7 lado a lado */}
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="closing_time" className="text-xs text-muted-foreground">Horário de Fechamento</Label>
                <Input id="closing_time" name="closing_time" type="time" value={form.closing_time || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div>
                  <Label className="text-xs text-muted-foreground">Wildcard?</Label>
                  {editMode ? (
                    <Select
                    value={form.is_wildcard ? "true" : "false"}
                    onValueChange={v => setForm(f => ({ ...f, is_wildcard: v === "true" }))}
                    disabled={!editMode}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{project.is_wildcard ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">24/7?</Label>
                  {editMode ? (
                    <Select
                    value={form.is_247 ? "true" : "false"}
                    onValueChange={v => setForm(f => ({ ...f, is_247: v === "true" }))}
                    disabled={!editMode}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{project.is_247 ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
                  )}
                </div>
              </div>            {/* Seção de cobrança sempre aparece no SmartCare AMS */}
            <div className="md:col-span-4 pt-6">
              <h2 className="flex items-center text-lg font-semibold pt-4 pb-3">
                <CircleDollarSignIcon className="w-4 h-4 mr-2" />Informações de Cobrança
              </h2>
                {/* Linha 1: Horas Máx, Horas Baseline */}
                <div className="grid gap-6 md:grid-cols-4">
                  <div>
                    <Label htmlFor="hours_max" className="text-xs text-muted-foreground">Horas Máx.</Label>
                    <Input id="hours_max" name="hours_max" type="number" value={form.hours_max || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                  </div>
                  <div>
                    <Label htmlFor="baseline_hours" className="text-xs text-muted-foreground">Horas Baseline</Label>
                    <Input id="baseline_hours" name="baseline_hours" type="number" value={form.baseline_hours || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                  </div>
                    <div>
                    <Label htmlFor="cred_exp_period" className="text-xs text-muted-foreground">Período Exp. Crédito (dias)</Label>
                    <Input id="cred_exp_period" name="cred_exp_period" type="number" value={form.cred_exp_period || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                  </div>
                </div>
                {/* Linha 2: Valores e Período Exp. Crédito */}
                <div className="grid gap-6 md:grid-cols-4 mt-6">
                  <div>
                    <Label htmlFor="value_hr_normal" className="text-xs text-muted-foreground">Valor Hora Normal</Label>
                    {editMode ? (
                      <Input id="value_hr_normal" name="value_hr_normal" type="number" step="0.01" value={form.value_hr_normal || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                    ) : (
                      <Input value={formatCurrency(form.value_hr_normal)} className="h-9" disabled />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="value_hr_excdn" className="text-xs text-muted-foreground">Valor Hora Excedente</Label>
                    {editMode ? (
                      <Input id="value_hr_excdn" name="value_hr_excdn" type="number" step="0.01" value={form.value_hr_excdn || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                    ) : (
                      <Input value={formatCurrency(form.value_hr_excdn)} className="h-9" disabled />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="value_hr_except" className="text-xs text-muted-foreground">Valor Hora Exceção</Label>
                    {editMode ? (
                      <Input id="value_hr_except" name="value_hr_except" type="number" step="0.01" value={form.value_hr_except || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                    ) : (
                      <Input value={formatCurrency(form.value_hr_except)} className="h-9" disabled />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="value_hr_warn" className="text-xs text-muted-foreground">Valor Hora Aviso</Label>
                    {editMode ? (
                      <Input id="value_hr_warn" name="value_hr_warn" type="number" step="0.01" value={form.value_hr_warn || ''} onChange={handleChange} className="h-9" disabled={!editMode} />
                    ) : (
                      <Input value={formatCurrency(form.value_hr_warn)} className="h-9" disabled />
                    )}
                  </div>                
                  </div>
              </div>
          </form>
        </CardContent>
      </Card>

    </>
  );
}
