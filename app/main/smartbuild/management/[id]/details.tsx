import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectUsersTab from "./users/ProjectUsersTab";
import ProjectTicketsTab from "./tickets/ProjectTicketsTab";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Contract } from "@/types/contracts";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";

interface ProjectDetailsTabProps {
  project: Contract;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
}

export default function ProjectDetailsTab({ project, editMode, setEditMode, tab, setTab }: ProjectDetailsTabProps) {
  const [form, setForm] = useState({
    projectName: project.projectName || "",
    projectDesc: project.projectDesc || "",
    start_date: project.start_date || "",
    end_at: project.end_at || "",
    project_type: project.project_type || "",
    project_status: (typeof project.project_status === "object" && project.project_status !== null && "id" in project.project_status)
      ? project.project_status.id || ""
      : (typeof project.project_status === "string" ? project.project_status : ""),
    is_wildcard: project.is_wildcard || false,
    is_247: project.is_247 || false,
  });
  const [statusOptions, setStatusOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch project status options
    fetch("/api/options?type=project_status")
      .then((res) => res.json())
      .then((data) => setStatusOptions(Array.isArray(data) ? data : []));
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
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/contracts/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          partnerId: project.partnerId || project.partner?.id || null, // Always send partnerId
          ...form,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar projeto");
      }
      setEditMode(false);
      setSuccess("Projeto atualizado com sucesso.");
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
      start_date: project.start_date || "",
      end_at: project.end_at || "",
      project_type: project.project_type || "",
      project_status: (typeof project.project_status === "object" && project.project_status !== null && "id" in project.project_status)
        ? project.project_status.id || ""
        : (typeof project.project_status === "string" ? project.project_status : ""),
      is_wildcard: project.is_wildcard || false,
      is_247: project.is_247 || false,
    });
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
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
          <Button size="sm" variant="outline" type="button" onClick={() => setEditMode((v) => !v)}>
            <Pencil className="w-4 h-4 mr-1" /> Editar
          </Button>
        )}
      </div>
      {error && <div className="text-destructive px-1 pt-2">{error}</div>}
      {success && <div className="text-green-600 px-1 pt-2">{success}</div>}
      <Card className="mt-4">
        <CardContent className="pt-6">
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
              <Input id="project_status" name="project_status" value={statusOptions.find(s => s.id === form.project_status)?.name || ""} className="h-9" disabled />
            </div>
            {/* Wildcard e 24/7 ao final */}
            <div className="flex gap-6 items-end md:col-span-2 lg:col-span-2">
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
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <div className="px-6 pb-4 pt-2">
          <Tabs value={tab === 'detalhes' || tab === 'tickets' || tab === 'usuarios' ? tab : 'tickets'} onValueChange={setTab} className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            </TabsList>
            <TabsContent value="tickets">
              {project.id ? (
                <ProjectTicketsTab projectId={String(project.id)} />
              ) : null}
            </TabsContent>
            <TabsContent value="usuarios">
              {project.id ? (
                <ProjectUsersTab projectId={String(project.id)} />
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </>
  );
}
