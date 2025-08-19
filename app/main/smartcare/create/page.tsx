"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X,Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { useUserProjects } from "@/hooks/useUserProjects";
import { getPriorityOptions, getCategoryOptions, getModuleOptions } from "@/hooks/useOptions";
import { TicketSelectionDialog } from "@/components/TicketSelectionDialog";

export default function CreateTicketPage() {
  const { profile, loading: loadingProfile, user } = useUserProfile();
  const { partners } = usePartnerOptions(user);
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
    attachments: [] as File[],
    ref_ticket_id: "",
    ref_external_id: "",
  });
  const [attachmentTypes, setAttachmentTypes] = useState<{ [fileName: string]: string }>({});
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
    setForm((prev) => {
      const newForm = { ...prev, [name]: String(value) };
      
      // Se mudou a categoria, verificar se precisa ajustar a prioridade
      if (name === "category_id") {
        const selectedCategory = categories.find(c => String(c.id) === value);
        
        // Se não for "Incidente", definir prioridade como "Baixa" automaticamente
        if (selectedCategory && selectedCategory.name !== "Incidente") {
          const baixaPriority = priorities.find(p => p.name === "Baixa");
          if (baixaPriority) {
            newForm.priority_id = String(baixaPriority.id);
          }
        }
      }
      
      return newForm;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setForm((prev) => ({ 
      ...prev, 
      attachments: [...prev.attachments, ...newFiles] 
    }));
    // Resetar o input para permitir selecionar o mesmo arquivo novamente se necessário
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const fileToRemove = form.attachments[index];
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
    // Remover o tipo do arquivo removido
    setAttachmentTypes((prev) => {
      const newTypes = { ...prev };
      delete newTypes[fileToRemove.name];
      return newTypes;
    });
  };

  const setAttachmentType = (fileName: string, type: string) => {
    setAttachmentTypes((prev) => ({ ...prev, [fileName]: type }));
  };

  // Função auxiliar para criar o ticket
  async function createTicket(formData: typeof form) {
    // Para múltiplos arquivos, sempre usar FormData
    const fd = new FormData();
    fd.append("contractId", formData.project_id);
    fd.append("partner_id", formData.partner_id);
    fd.append("title", formData.title);
    fd.append("category_id", formData.category_id);
    fd.append("module_id", formData.module_id);
    fd.append("priority_id", formData.priority_id);
    fd.append("description", formData.description);
    fd.append("type_id", "1"); // SmartCare é sempre AMS
    if (formData.ref_ticket_id) {
      fd.append("ref_ticket_id", formData.ref_ticket_id);
    }
    if (formData.ref_external_id) {
      fd.append("ref_external_id", formData.ref_external_id);
    }

    // Adicionar arquivos se houver
    formData.attachments.forEach((file, index) => {
      fd.append(`file_${index}`, file);
    });

    const ticketRes = await fetch("/api/tickets/create", {
      method: "POST",
      body: fd,
    });

    if (!ticketRes.ok) {
      const data = await ticketRes.json();
      throw new Error(data.error ?? "Erro ao criar chamado");
    }
    const ticketData = await ticketRes.json();
    return ticketData;
  }

  // Função auxiliar para upload de anexos
  async function uploadAttachments(formData: typeof form, ticketId: string, attachmentTypes: { [fileName: string]: string }) {
    const msgRes = await fetch(`/api/messages?ticket_id=${ticketId}`);
    if (!msgRes.ok) throw new Error("Erro ao buscar mensagem do chamado");
    const msgs = await msgRes.json();
    const systemMsg = Array.isArray(msgs) && msgs.length > 0 ? msgs[0] : null;
    if (!systemMsg?.id) throw new Error("Mensagem do sistema não encontrada");

    // Upload de cada arquivo separadamente
    for (const file of formData.attachments) {
      const attFd = new FormData();
      attFd.append("file", file);
      attFd.append("messageId", systemMsg.id);
      attFd.append("ticketId", ticketId);
      const fileType = attachmentTypes[file.name];
      if (fileType) attFd.append("att_type", fileType);

      const attRes = await fetch("/api/attachment", {
        method: "POST",
        body: attFd,
      });
      if (!attRes.ok) {
        const data = await attRes.json();
        throw new Error(`Erro ao enviar anexo ${file.name}: ${data.error ?? "Erro desconhecido"}`);
      }
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

      // Validação - projeto é obrigatório
      if (!form.project_id) {
        setError("Selecione o projeto.");
        setLoading(false);
        return;
      }

      // Validação - parceiro é obrigatório (mas pode ser auto-selecionado)
      if (!form.partner_id) {
        setError("Erro interno: parceiro não foi definido. Tente selecionar o projeto novamente.");
        setLoading(false);
        return;
      }

      // Garantir que a prioridade esteja definida
      const finalForm = { ...form };
      if (!finalForm.priority_id) {
        const baixaPriority = priorities.find(p => p.name === "Baixa");
        if (baixaPriority) {
          finalForm.priority_id = String(baixaPriority.id);
        } else {
          setError("Erro interno: prioridade 'Baixa' não encontrada.");
          setLoading(false);
          return;
        }
      }
      
      // Validação dos anexos - todos os arquivos devem ter tipo definido
      const hasAttachments = finalForm.attachments.length > 0;
      if (hasAttachments) {
        const missingTypes = finalForm.attachments.filter(file => !attachmentTypes[file.name]);
        if (missingTypes.length > 0) {
          setError(`Selecione o tipo para os seguintes anexos: ${missingTypes.map(f => f.name).join(', ')}`);
          setLoading(false);
          return;
        }
      }
      
      const ticketData = await createTicket(finalForm);
      const externalId = ticketData?.external_id ?? ticketData?.data?.external_id;
      const ticketId = ticketData?.id ?? ticketData?.data?.id;
      if (hasAttachments && ticketId) {
        await uploadAttachments(finalForm, ticketId, attachmentTypes);
      }
      // Mensagem personalizada para usuários functional-adm
      if (profile === "functional-adm") {
        toast.success(`Chamado ${externalId || ticketId} criado com sucesso. Você foi automaticamente vinculado como responsável principal do chamado.`);
      } else {  
        toast.success(`Chamado ${externalId || ticketId} criado com sucesso.`);
      }
      
      // Reset do formulário
      const resetForm = {
        project_id: isClientUser && filteredProjects.length === 1 ? String(filteredProjects[0].id) : "",
        partner_id: isClientUser && user?.partner_id ? String(user.partner_id) : "",
        title: "",
        category_id: "",
        module_id: "",
        priority_id: "",
        description: "",
        attachments: [] as File[],
        ref_ticket_id: "",
        ref_external_id: "",
      };
      setForm(resetForm);
      setAttachmentTypes({});
      setSelectedTicketTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Handler especial para seleção de parceiro (admin-adm)
  const handlePartnerSelect = (value: string) => {
    setForm((prev) => ({ ...prev, partner_id: value, project_id: "" }));
  };

  // Handler para seleção de projeto - seleciona automaticamente o parceiro
  const handleProjectSelect = (projectId: string) => {
    const selectedProject = filteredProjects.find(p => String(p.id) === projectId);
    if (selectedProject && selectedProject.partner_id) {
      setForm((prev) => ({
        ...prev,
        project_id: projectId,
        partner_id: String(selectedProject.partner_id)
      }));
    } else {
      setForm((prev) => ({ ...prev, project_id: projectId }));
    }
  };

  // Determinação se é usuário cliente
  const isClientUser = user?.is_client || false;

  // Se for cliente, seleciona o parceiro automaticamente
  React.useEffect(() => {
    if (isClientUser && user?.partner_id && !form.partner_id) {
      setForm((prev) => ({ ...prev, partner_id: String(user.partner_id) }));
    }
  }, [isClientUser, user?.partner_id, form.partner_id]);

  // Nova lógica de filtragem de projetos baseada no perfil
  let useUserProjectsOptions = {};
  let shouldUseUserProjects = false;
  
  if (!isClientUser && profile !== "admin-adm") {
    // Para usuários administrativos (exceto admin-adm)
    if (profile === "functional-adm" && user?.id) {
      // Functional-adm: apenas projetos onde está alocado
      useUserProjectsOptions = {
        userId: user.id,
        profile: "functional-adm",
        enabled: true
      };
      shouldUseUserProjects = true;
    } else if (profile === "manager-adm" && user?.id) {
      // Manager-adm: apenas projetos que gerencia
      useUserProjectsOptions = {
        userId: user.id,
        profile: "manager-adm",
        enabled: true
      };
      shouldUseUserProjects = true;
    }
  }

  // Hook para projetos do usuário (functional/manager) ou projetos filtrados por parceiro (admin)
  const { projects: userProjects } = useUserProjects(useUserProjectsOptions);

  // Hook para projetos tradicionais (clientes e admin-adm)
  let projectOptionsParams: Record<string, string> = {};
  
  if (isClientUser && user?.partner_id) {
    // Para clientes, usar o parceiro selecionado no formulário ou o parceiro do usuário
    const partnerId = form.partner_id || String(user.partner_id);
    projectOptionsParams = { partnerId, projectType: "AMS" };
  } else if (profile === "admin-adm") {
    // Para admin-adm, buscar todos os projetos AMS
    projectOptionsParams = { projectType: "AMS" };
  }
  
  const { projects: clientProjects } = useProjectOptions((isClientUser || profile === "admin-adm") ? { ...projectOptionsParams, user } : { user });
  
  // Determinar quais projetos usar com useMemo para evitar re-renders desnecessários
  const filteredProjects = useMemo(() => {
    if (isClientUser) {
      return clientProjects.filter((p) => p.project_type === "AMS");
    } else if (profile === "admin-adm") {
      return clientProjects.filter((p) => p.project_type === "AMS");
    } else if (shouldUseUserProjects) {
      return userProjects;
    } else {
      return [];
    }
  }, [isClientUser, profile, clientProjects, shouldUseUserProjects, userProjects]);

  // Para clientes, verificar se existe projeto AMS
  const hasAMSProject = isClientUser ? filteredProjects.length > 0 : true;

  // Auto-selecionar projeto AMS para clientes (se só tiver um)
  React.useEffect(() => {
    if (isClientUser && filteredProjects.length === 1 && !form.project_id) {
      setForm((prev) => ({ ...prev, project_id: String(filteredProjects[0].id) }));
    }
  }, [isClientUser, filteredProjects, form.project_id]);

  // Debug: log dos valores para usuários administrativos
  React.useEffect(() => {
    if (!isClientUser) {
      console.log("SmartCare Create - Debug Admin:", {
        profile,
        shouldUseUserProjects,
        filteredProjectsCount: filteredProjects.length,
        partner_id: form.partner_id,
        project_id: form.project_id,
        isAdminAdm: profile === "admin-adm",
        filteredProjects: filteredProjects.map(p => ({
          id: p.id,
          name: p.name,
          partner_id: p.partner_id
        }))
      });
    }
  }, [profile, shouldUseUserProjects, filteredProjects, form.partner_id, form.project_id, isClientUser]);

  if (loadingProfile) {
    return <div>Carregando perfil...</div>;
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
          <p className="text-sm text-muted-foreground">
            Cria um novo chamado dentro do seu contrato AMS
            {profile === "functional-adm" && (
              <span className="mt-1 text-blue-600 font-medium flex items-center gap-1">
                <Info className="w-4 h-4" />
                Você será automaticamente vinculado como responsável principal do chamado
              </span>
            )}
          </p>
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
                  className="truncate"
                />
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Campo Parceiro - apenas para clientes */}
              {isClientUser && (
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
                      <SelectValue placeholder="Selecione o parceiro" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPartners.map((p) => (
                        <SelectItem key={String(p.id)} value={String(p.id)}>
                          <span className="truncate">{p.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Campo de projeto - todos podem ver, mas com filtragem apropriada */}
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium mb-1">
                  Projeto <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.project_id}
                  onValueChange={handleProjectSelect}
                  disabled={
                    loading ||
                    (isClientUser && filteredProjects.length <= 1) ||
                    filteredProjects.length === 0
                  }
                >
                  <SelectTrigger className="w-full" id="project_id">
                    <SelectValue placeholder="Selecione o projeto" className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filteredProjects ?? []).map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        <span className="truncate">{p.name || p.projectName || p.projectDesc}</span>
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
                    <SelectValue placeholder="Selecione o tipo" className="truncate">
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
                    <SelectValue placeholder="Selecione o módulo" className="truncate">
                      {form.module_id && modules.find(m => String(m.id) === form.module_id)?.name}
                    </SelectValue>
                  </SelectTrigger>                  <SelectContent>
                    {(modules ?? []).map((m) => (
                      <SelectItem key={String(m.id)} value={String(m.id)}>
                        <div className="flex flex-col">
                          <span className="truncate">{m.name}</span>
                          <span className="text-xs italic text-muted-foreground lowercase truncate">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo Prioridade - só aparece para Incidentes */}
              {(() => {
                const selectedCategory = categories.find(c => String(c.id) === form.category_id);
                const isIncidente = selectedCategory?.name === "Incidente";
                
                return isIncidente ? (
                  <div>
                    <label htmlFor="priority_id" className="block text-sm font-medium mb-1">
                      Prioridade <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={form.priority_id}
                      onValueChange={(v) => handleSelect("priority_id", v)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full" id="priority_id">
                        <SelectValue placeholder="Selecione a prioridade" className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {(priorities ?? []).map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            <span className="truncate">{p.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null;
              })()}
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
                className="w-full h-48 border-2 bg-background text-foreground rounded p-2 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none resize-none overflow-auto"
              />
            </div>

            {/* Campos de Referência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ref_ticket" className="block text-sm font-medium mb-1">
                  Ticket Relacionado
                </label>
                <TicketSelectionDialog
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal truncate"
                      disabled={loading}
                    >
                      <span className="truncate">{selectedTicketTitle || "Selecionar ticket relacionado..."}</span>
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
                  className="truncate"
                />
              </div>
            </div>            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            {/* Seção de Anexos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Anexos</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-input')?.click()}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Adicionar Arquivos
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="*"
                    onChange={handleFile}
                    disabled={loading}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.attachments.length > 0 ? `${form.attachments.length} arquivo(s) selecionado(s)` : "Nenhum arquivo selecionado"}
                  </span>
                </div>
              </div>

              {/* Lista de arquivos selecionados */}
              {form.attachments.length > 0 && (
                <div className="space-y-2">
                  {form.attachments.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      
                      <div className="flex-1 max-w-xs">
                        <Select
                          value={attachmentTypes[file.name] || ""}
                          onValueChange={(value) => setAttachmentType(file.name, value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Tipo do anexo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Evidencia de Erro">
                              <span className="text-xs">Evidência de Erro</span>
                            </SelectItem>
                            <SelectItem value="Evidencia de Teste">
                              <span className="text-xs">Evidência de Teste</span>
                            </SelectItem>
                            <SelectItem value="Especificação">
                              <span className="text-xs">Especificação</span>
                            </SelectItem>
                            <SelectItem value="Detalhamento de Chamado">
                              <span className="text-xs">Detalhamento de Chamado</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                  const resetForm = {
                    project_id: isClientUser && filteredProjects.length === 1 ? String(filteredProjects[0].id) : "",
                    partner_id: isClientUser && user?.partner_id ? String(user.partner_id) : "",
                    title: "",
                    category_id: "",
                    module_id: "",
                    priority_id: "",
                    description: "",
                    attachments: [] as File[],
                    ref_ticket_id: "",
                    ref_external_id: "",
                  };
                  setForm(resetForm);
                  setSelectedTicketTitle("");
                  setAttachmentTypes({});
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