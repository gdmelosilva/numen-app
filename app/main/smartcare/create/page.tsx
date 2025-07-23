"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { toast } from "sonner";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import DeniedAccessPage from "@/components/DeniedAccessPage";
import { getPriorityOptions, getCategoryOptions, getModuleOptions } from "@/hooks/useOptions";
import { TicketSelectionDialog } from "@/components/TicketSelectionDialog";

export default function CreateTicketPage() {
  const { profile, loading: loadingProfile, user } = useUserProfile();
  const { partners } = usePartnerOptions();
  // Estados para categorias, prioridades e módulos AMS
  const [categories, setCategories] = React.useState<{ id: string; name: string; description: string }[]>([]);
  const [priorities, setPriorities] = React.useState<{ id: string; name: string }[]>([]);
  const [modules, setModules] = React.useState<{ id: string; name: string; description: string }[]>([]);

  // Carregar categorias, prioridades e módulos AMS
  React.useEffect(() => {
    getCategoryOptions(true).then((data) => setCategories(data ?? []));
    getPriorityOptions().then((data) => setPriorities(data ?? []));
    getModuleOptions().then((data) => setModules(data ?? []));
  }, []);

  // Filtragem de parceiros conforme perfil
  let filteredPartners = partners;
  if (user?.is_client && user?.partner_id) {
    // Clientes só podem ver seu próprio parceiro
    filteredPartners = partners.filter((p) => String(p.id) === String(user.partner_id));
  }

  const [form, setForm] = useState({
    project_id: "",
    partner_id: "",
    title: "",
    category_id: "",
    module_id: "",
    priority_id: "",
    description: "",
    attachment: null as File | null,
    ref_ticket_id: "",
    ref_external_id: "",
  });
  const [attachmentType, setAttachmentType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketTitle, setSelectedTicketTitle] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] ?? null }));
  };

  const handleAttachmentType = (value: string) => {
    setAttachmentType(value);
  };

  // Função auxiliar para criar o ticket
  async function createTicket(formData: typeof form) {
    if (formData.attachment) {
      const fd = new FormData();
      fd.append("contractId", formData.project_id);
      fd.append("partner_id", formData.partner_id);
      fd.append("title", formData.title);
      fd.append("category_id", formData.category_id);      fd.append("module_id", formData.module_id);
      fd.append("priority_id", formData.priority_id);
      fd.append("description", formData.description);
      fd.append("type_id", "1"); // SmartCare é sempre AMS
      if (formData.ref_ticket_id) {
        fd.append("ref_ticket_id", formData.ref_ticket_id);
      }
      if (formData.ref_external_id) {
        fd.append("ref_external_id", formData.ref_external_id);
      }
      const ticketRes = await fetch("/api/tickets/create", {
        method: "POST",
        body: fd,
      });
      if (!ticketRes.ok) {
        const data = await ticketRes.json();
        throw new Error(data.error ?? "Erro ao criar chamado");
      }
      const ticketData = await ticketRes.json();
      return ticketData?.id ?? ticketData?.data?.id;
    } else {
      const ticketRes = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: formData.project_id,
          partner_id: formData.partner_id,
          title: formData.title,
          category_id: formData.category_id,          module_id: formData.module_id,
          priority_id: formData.priority_id,
          description: formData.description,
          type_id: "1", // SmartCare é sempre AMS
          ...(formData.ref_ticket_id && { ref_ticket_id: formData.ref_ticket_id }),
          ...(formData.ref_external_id && { ref_external_id: formData.ref_external_id }),
        }),
      });
      if (!ticketRes.ok) {
        const data = await ticketRes.json();
        throw new Error(data.error ?? "Erro ao criar chamado");
      }
      const ticketData = await ticketRes.json();
      return ticketData?.id ?? ticketData?.data?.id;
    }
  }

  // Função auxiliar para upload de anexo
  async function uploadAttachment(formData: typeof form, ticketId: string, attachmentType: string) {
    const msgRes = await fetch(`/api/messages?ticket_id=${ticketId}`);
    if (!msgRes.ok) throw new Error("Erro ao buscar mensagem do chamado");
    const msgs = await msgRes.json();
    const systemMsg = Array.isArray(msgs) && msgs.length > 0 ? msgs[0] : null;
    if (!systemMsg?.id) throw new Error("Mensagem do sistema não encontrada");
    const attFd = new FormData();
    if (formData.attachment) attFd.append("file", formData.attachment);
    attFd.append("messageId", systemMsg.id);
    attFd.append("ticketId", ticketId);
    if (attachmentType) attFd.append("att_type", attachmentType);
    const attRes = await fetch("/api/attachment", {
      method: "POST",
      body: attFd,
    });
    if (!attRes.ok) {
      const data = await attRes.json();
      throw new Error(data.error ?? "Erro ao enviar anexo");
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Debug para clientes
      if (isClientUser) {
        console.log("SmartCare Submit - Valores:", {
          partner_id: form.partner_id,
          project_id: form.project_id,
          hasAMSProject,
          filteredProjectsCount: filteredProjects.length
        });
      }

      // Validação - para clientes, os campos devem estar auto-preenchidos
      if (!form.project_id || !form.partner_id) {
        if (isClientUser) {
          const missingFields = [];
          if (!form.partner_id) missingFields.push("parceiro");
          if (!form.project_id) missingFields.push("projeto");
          setError(`Erro interno: ${missingFields.join(" e ")} não ${missingFields.length > 1 ? 'foram definidos' : 'foi definido'} automaticamente.`);
        } else {
          setError("Selecione o projeto e o parceiro.");
        }
        setLoading(false);
        return;
      }
      
      if (form.attachment && !attachmentType) {
        setError("Selecione o tipo do anexo quando um arquivo for adicionado.");
        setLoading(false);
        return;
      }
      const ticketId = await createTicket(form);
      if (form.attachment && ticketId) {
        await uploadAttachment(form, ticketId, attachmentType);
      }
      toast.success("Chamado criado com sucesso.");
      setForm({
        project_id: isClientUser && filteredProjects.length === 1 ? String(filteredProjects[0].id) : "",
        partner_id: isClientUser && user?.partner_id ? String(user.partner_id) : "",
        title: "",
        category_id: "",
        module_id: "",
        priority_id: "",
        description: "",
        attachment: null,
        ref_ticket_id: "",
        ref_external_id: "",
      });
      setAttachmentType("");
      setSelectedTicketTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Handler especial para seleção de parceiro (admin)
  const handlePartnerSelect = (value: string) => {
    setForm((prev) => ({ ...prev, partner_id: value, project_id: "" }));
  };

  // Determinação se é usuário cliente
  const isClientUser = user?.is_client || false;

  // Se for cliente, seleciona o parceiro automaticamente
  React.useEffect(() => {
    if (isClientUser && user?.partner_id && !form.partner_id) {
      setForm((prev) => ({ ...prev, partner_id: String(user.partner_id) }));
    }
  }, [isClientUser, user?.partner_id, form.partner_id]);

  // Filtragem de projetos conforme perfil
  let projectOptionsParams: Record<string, string> = {};
  let onlyUserProject = false;
  
  if (profile === "admin-adm" && form.partner_id) {
    projectOptionsParams = { partnerId: String(form.partner_id) };
  } else if ((profile === "manager-adm" || profile === "manager-client") && user?.partner_id) {
    projectOptionsParams = { partnerId: String(user.partner_id) };
  } else if (isClientUser && user?.partner_id) {
    // Para clientes, usar o parceiro selecionado no formulário ou o parceiro do usuário
    const partnerId = form.partner_id || String(user.partner_id);
    projectOptionsParams = { partnerId, projectType: "AMS" };
  } else if ((profile === "functional-adm" || profile === "functional-client") && user?.project_id) {
    projectOptionsParams = { projectId: String(user.project_id) };
    onlyUserProject = true;
  }
  
  const { projects } = useProjectOptions(projectOptionsParams);
  
  // Para functional, filtrar client-side também
  // Para clientes, filtrar apenas projetos AMS
  const filteredProjects = onlyUserProject && user?.project_id
    ? projects.filter((p) => String(p.id) === String(user.project_id))
    : isClientUser 
      ? projects.filter((p) => p.project_type === "AMS")
      : projects;

  // Para clientes, verificar se existe projeto AMS
  const hasAMSProject = isClientUser ? filteredProjects.length > 0 : true;

  // Auto-selecionar projeto AMS para clientes
  React.useEffect(() => {
    if (isClientUser && filteredProjects.length === 1 && !form.project_id) {
      setForm((prev) => ({ ...prev, project_id: String(filteredProjects[0].id) }));
    }
  }, [isClientUser, filteredProjects, form.project_id]);

  // Debug: log dos valores para clientes
  React.useEffect(() => {
    if (isClientUser) {
      console.log("SmartCare Create - Debug:", {
        isClientUser,
        profile,
        partner_id: form.partner_id,
        project_id: form.project_id,
        user_partner_id: user?.partner_id,
        filteredProjects: filteredProjects.length,
        hasAMSProject
      });
    }
  }, [isClientUser, profile, form.partner_id, form.project_id, user?.partner_id, filteredProjects.length, hasAMSProject]);

  if (loadingProfile) {
    return <div>Carregando perfil...</div>;
  }

  // Se for functional, bloqueia acesso
  if (profile === "functional-adm" || profile === "functional-client") {
    return <DeniedAccessPage />;
  }

  // Se for cliente e não tem projeto AMS, bloqueia acesso
  if (isClientUser && !hasAMSProject) {
    return (
      <div className="w-full max-w-full mx-auto flex flex-col gap-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Seu parceiro não possui um projeto AMS ativo. Entre em contato com o administrador para solicitar a criação de um projeto AMS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Abrir Chamado</h2>
          <p className="text-sm text-muted-foreground">Cria um novo chamado dentro do seu contrato AMS</p>
        </div>
        
      <Card className="w-full">
        <CardContent>
          <form className="space-y-6 mt-6" onSubmit={handleSubmit}>              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Título <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Todos podem escolher o parceiro, mas clientes só veem o próprio */}
              <div>
                <label htmlFor="partner_id" className="block text-sm font-medium mb-1">
                  Parceiro <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.partner_id}
                  onValueChange={handlePartnerSelect}
                  disabled={loading || isClientUser}
                >
                  <SelectTrigger className="w-full" id="partner_id">
                    <SelectValue placeholder="Selecione o parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPartners.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Campo de projeto - todos podem ver, mas com filtragem apropriada */}
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium mb-1">
                  Projeto <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => handleSelect("project_id", v)}
                  disabled={
                    loading ||
                    (profile === "admin-adm" && !form.partner_id) ||
                    (isClientUser && filteredProjects.length <= 1)
                  }
                >
                  <SelectTrigger className="w-full" id="project_id">
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filteredProjects ?? []).map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div>
                <label htmlFor="category_id" className="block text-sm font-medium mb-1">
                  Tipo Chamado <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => handleSelect("category_id", v)}
                  disabled={loading}
                >                  <SelectTrigger className="w-full" id="category_id">
                    <SelectValue placeholder="Selecione o tipo">
                      {form.category_id && categories.find(c => String(c.id) === form.category_id)?.name}
                    </SelectValue>
                  </SelectTrigger><SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        <div className="flex flex-col">
                          <span>{c.name}</span>
                          <span className="text-xs italic text-muted-foreground lowercase">{c.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div>
                <label htmlFor="module_id" className="block text-sm font-medium mb-1">
                  Módulo Associado <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.module_id}
                  onValueChange={(v) => handleSelect("module_id", v)}
                  disabled={loading}
                >                  <SelectTrigger className="w-full" id="module_id">
                    <SelectValue placeholder="Selecione o módulo">
                      {form.module_id && modules.find(m => String(m.id) === form.module_id)?.name}
                    </SelectValue>
                  </SelectTrigger>                  <SelectContent>
                    {(modules ?? []).map((m) => (
                      <SelectItem key={String(m.id)} value={String(m.id)}>
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-xs italic text-muted-foreground lowercase">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div>
                <label htmlFor="priority_id" className="block text-sm font-medium mb-1">
                  Prioridade <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.priority_id}
                  onValueChange={(v) => handleSelect("priority_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full" id="priority_id">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>                  <SelectContent>
                    {(priorities ?? []).map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Descrição do Chamado <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full h-48 border-2 bg-secondary text-foreground rounded p-2 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none"
              />
            </div>

            {/* Campos de Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ref_ticket" className="block text-sm font-medium mb-1">
                  Ticket Relacionado
                </label>
                <TicketSelectionDialog
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={loading}
                    >
                      {selectedTicketTitle || "Selecionar ticket relacionado..."}
                    </Button>
                  }
                  onSelect={(ticketId, ticketTitle) => {
                    setForm(prev => ({ ...prev, ref_ticket_id: ticketId }));
                    setSelectedTicketTitle(ticketTitle);
                  }}
                  selectedTicketId={form.ref_ticket_id}
                />
              </div>

              <div>
                <label htmlFor="ref_external_id" className="block text-sm font-medium mb-1">
                  Cód. Referência Externa
                </label>
                <Input
                  id="ref_external_id"
                  name="ref_external_id"
                  value={form.ref_external_id}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={40}
                  placeholder="Código de referência externa"
                />
              </div>
            </div>            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
              {/* Seção de Anexo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">              <div>
                <label htmlFor="attachment" className="block text-sm font-medium mb-1">Anexo</label>
                <Input
                  id="attachment"
                  type="file"
                  accept="*"
                  onChange={handleFile}
                  disabled={loading}
                  placeholder="Selecionar arquivo"
                />
              </div>
              
              {form.attachment && (
                <div className="flex gap-2 items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, attachment: null }));
                      setAttachmentType("");
                    }}
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    title="Remover anexo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <label htmlFor="attachment_type" className="block text-sm font-medium mb-1">
                      Tipo do Anexo <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={attachmentType}
                      onValueChange={handleAttachmentType}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full" id="attachment_type">
                        <SelectValue placeholder="Selecione o tipo do anexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Evidencia de Erro">Evidência de Erro</SelectItem>
                        <SelectItem value="Evidencia de Teste">Evidência de Teste</SelectItem>
                        <SelectItem value="Especificação">Especificação</SelectItem>
                        <SelectItem value="Detalhamento de Chamado">Detalhamento de Chamado</SelectItem>
                        {/* <SelectItem value="Arquivo Contratual">Arquivo Contratual</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="colored2"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Criar Chamado"}
              </Button>
              <Button
                type="reset"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setForm({
                    project_id: isClientUser && filteredProjects.length === 1 ? String(filteredProjects[0].id) : "",
                    partner_id: isClientUser && user?.partner_id ? String(user.partner_id) : "",
                    title: "",
                    category_id: "",
                    module_id: "",
                    priority_id: "",
                    description: "",
                    attachment: null,
                    ref_ticket_id: "",
                    ref_external_id: "",
                  });
                  setSelectedTicketTitle("");
                  setAttachmentType("");
                }}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}