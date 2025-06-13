"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Info, Calendar, File } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AMSProject {
  id: string;
  projectExtId?: string;
  projectName: string;
  projectDesc?: string;
  partnerId: string;
  partner?: Record<string, unknown> | null;
  project_type: string;
  project_status?: string | number | { name: string } | null;
  is_wildcard?: boolean | null;
  is_247?: boolean | null;
  start_date?: string | null;
  end_at: string;
  hours_max?: number | null;
  cred_exp_period?: number | null;
  value_hr_normal?: number | null;
  value_hr_excdn?: number | null;
  value_hr_except?: number | null;
  value_hr_warn?: number | null;
  baseline_hours?: number | null;
  opening_time?: string | null;
  closing_time?: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export default function AMSDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<AMSProject | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/smartcare/ams-projects?id=${id}`);
        if (!res.ok) throw new Error("Erro ao buscar projeto AMS");
        const data = await res.json();
        setProject(Array.isArray(data) ? data[0] : data);
      } catch {
        setError("Erro ao buscar detalhes do projeto AMS");
      } finally {
        setLoading(false);
      }
    }
    async function fetchMessages() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/messages?ticket_id=${id}`);
        if (!res.ok) throw new Error("Erro ao buscar mensagens");
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setError("Erro ao buscar mensagens do projeto AMS");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchProject();
      fetchMessages();
    }
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newMessage, ticket_id: id }),
      });
      if (!res.ok) throw new Error("Erro ao enviar mensagem");
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch {
      setError("Erro ao enviar mensagem");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !project) {
    return <div className="p-6 text-destructive">{error || "Projeto AMS não encontrado."}</div>;
  }

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="messages">Mensagens</TabsTrigger>
      </TabsList>
      <Card className="p-6 rounded-md w-full h-full">
        <TabsContent value="details">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
              <div className="text-xl font-semibold flex-1">
                {project.projectExtId ? String(project.projectExtId).padStart(5, "0") + " - " : ""}{project.projectName}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-4 text-md text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {project.start_date ? new Date(project.start_date).toLocaleDateString("pt-BR") : "-"}
                </div>
                <Badge variant="default" className="text-md">{typeof project.project_status === 'object' && project.project_status && 'name' in project.project_status ? project.project_status.name : project.project_status || '-'}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="my-4 mb-4" />
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-2">
                <Info className="w-4 h-4" />
                Descrição
              </div>
              {typeof project.projectDesc === 'string' ? project.projectDesc : '-'}
            </div>
          </CardContent>
          <CardContent>
            <Separator className="my-4 mb-4" />
            <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
              <File className="w-4 h-4" />
              Informações do Projeto
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Tipo</span>
                <span>{project.project_type || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Parceiro</span>
                <span>{project.partnerId || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Início</span>
                <span>{project.start_date ? new Date(project.start_date).toLocaleDateString("pt-BR") : '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Fim</span>
                <span>{project.end_at ? new Date(project.end_at).toLocaleDateString("pt-BR") : '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Wildcard?</span>
                <span>{project.is_wildcard ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">24/7?</span>
                <span>{project.is_247 ? 'Sim' : 'Não'}</span>
              </div>
            </div>
            <Separator className="my-4 mb-4" />
          </CardContent>
        </TabsContent>
        <TabsContent value="messages">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
              <div className="text-xl font-semibold flex-1">
                Mensagens
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="my-4 mb-4" />
            <div className="flex flex-col">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Nenhuma mensagem encontrada para este projeto.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border-b last:border-b-0 py-4">
                    <div className="text-sm text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-md">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardContent>
            <Separator className="my-4 mb-4" />
            <div className="flex flex-col gap-4">
              <div className="text-muted-foreground text-xs font-medium">
                Enviar Mensagem
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="whitespace-nowrap">
                  Enviar
                </Button>
              </div>
            </div>
            <Separator className="my-4 mb-4" />
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}