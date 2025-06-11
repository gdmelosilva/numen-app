import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProjectUsersTab from "./users/ProjectUsersTab";
import ProjectTicketsTab from "./tickets/ProjectTicketsTab";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Contract } from "@/types/contracts";
import { Dispatch, SetStateAction } from "react";

interface ProjectDetailsTabProps {
  project: Contract;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
}

export default function ProjectDetailsTab({ project, editMode, setEditMode, tab, setTab }: ProjectDetailsTabProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
        <h1 className="text-2xl font-bold truncate">{project.projectName || 'Projeto'}</h1>
        <Button size="sm" variant="outline" onClick={() => setEditMode((v) => !v)}>
          <Pencil className="w-4 h-4 mr-1" /> Editar
        </Button>
      </div>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <form className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">ID</Label>
              <input className="h-9 w-full bg-transparent" value={project.id} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <input className="h-9 w-full bg-transparent" value={project.projectName || ''} disabled={!editMode} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <input className="h-9 w-full bg-transparent" value={project.projectDesc || ''} disabled={!editMode} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Parceiro</Label>
              <input className="h-9 w-full bg-transparent" value={project.partner?.partner_desc || ''} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Início</Label>
              <input className="h-9 w-full bg-transparent" value={project.start_date ? format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR }) : ''} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <input className="h-9 w-full bg-transparent" value={project.end_at ? format(new Date(project.end_at), "dd/MM/yyyy", { locale: ptBR }) : ''} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <input className="h-9 w-full bg-transparent" value={project.project_type || ''} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <input className="h-9 w-full bg-transparent" value={project.project_status?.name || ''} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Wildcard?</Label>
              <div>{project.is_wildcard ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">24/7?</Label>
              <div>{project.is_247 ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
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
