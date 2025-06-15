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
import { toast } from "sonner";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import { useTicketModules } from "@/hooks/useTicketModules";
import {
  Card,
  CardHeader,
  CardContent
} from "@/components/ui/card";

// Simulação de projetos (substitua por hook real depois)
const useProjectOptions = () => {
  const [projects] = useState([
    { id: "1", name: "Projeto A" },
    { id: "2", name: "Projeto B" },
  ]);
  return { projects, loading: false };
};

// Simulação de categorias/prioridades (substitua por fetch real depois)
const useCategoryOptions = () => {
  const [categories] = useState([
    { id: "1", name: "Incidente" },
    { id: "2", name: "Solicitação" },
  ]);
  return { categories, loading: false };
};
const usePriorityOptions = () => {
  const [priorities] = useState([
    { id: "1", name: "Baixa" },
    { id: "2", name: "Média" },
    { id: "3", name: "Alta" },
  ]);
  return { priorities, loading: false };
};

export default function CreateTicketPage() {
  const { projects } = useProjectOptions();
  const { partners } = usePartnerOptions();
  const { modules } = useTicketModules();
  const { categories } = useCategoryOptions();
  const { priorities } = usePriorityOptions();

  const [form, setForm] = useState({
    project_id: "",
    partner_id: "",
    title: "",
    category_id: "",
    module_id: "",
    priority_id: "",
    description: "",
    attachment: null as File | null,
  });
  const [attachmentType, setAttachmentType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] || null }));
  };

  const handleAttachmentType = (value: string) => {
    setAttachmentType(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.project_id || !form.partner_id) {
        setError("Selecione o projeto e o parceiro.");
        setLoading(false);
        return;
      }
      let ticketId: string | null = null;
      let ticketRes, ticketData;
      if (form.attachment) {
        const fd = new FormData();
        fd.append("contractId", form.project_id);
        fd.append("partner_id", form.partner_id);
        fd.append("title", form.title);
        fd.append("category_id", form.category_id);
        fd.append("module_id", form.module_id);
        fd.append("priority_id", form.priority_id);
        fd.append("description", form.description);
        ticketRes = await fetch("/api/tickets/create", {
          method: "POST",
          body: fd,
        });
        if (!ticketRes.ok) {
          const data = await ticketRes.json();
          throw new Error(data.error || "Erro ao criar chamado");
        }
        ticketData = await ticketRes.json();
        ticketId = ticketData?.id || ticketData?.data?.id;
      } else {
        ticketRes = await fetch("/api/tickets/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractId: form.project_id,
            partner_id: form.partner_id,
            title: form.title,
            category_id: form.category_id,
            module_id: form.module_id,
            priority_id: form.priority_id,
            description: form.description,
          }),
        });
        if (!ticketRes.ok) {
          const data = await ticketRes.json();
          throw new Error(data.error || "Erro ao criar chamado");
        }
        ticketData = await ticketRes.json();
        ticketId = ticketData?.id || ticketData?.data?.id;
      }
      if (form.attachment && ticketId) {
        const msgRes = await fetch(`/api/messages?ticket_id=${ticketId}`);
        if (!msgRes.ok) throw new Error("Erro ao buscar mensagem do chamado");
        const msgs = await msgRes.json();
        const systemMsg = Array.isArray(msgs) && msgs.length > 0 ? msgs[0] : null;
        if (!systemMsg?.id) throw new Error("Mensagem do sistema não encontrada");
        const attFd = new FormData();
        attFd.append("file", form.attachment);
        attFd.append("messageId", systemMsg.id);
        attFd.append("ticketId", ticketId);
        if (attachmentType) attFd.append("att_type", attachmentType);
        const attRes = await fetch("/api/attachment", {
          method: "POST",
          body: attFd,
        });
        if (!attRes.ok) {
          const data = await attRes.json();
          throw new Error(data.error || "Erro ao enviar anexo");
        }
      }
      toast.success("Chamado criado com sucesso.");
      setForm({
        project_id: "",
        partner_id: "",
        title: "",
        category_id: "",
        module_id: "",
        priority_id: "",
        description: "",
        attachment: null,
      });
      setAttachmentType("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full mx-auto flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Abrir Chamado</h2>
          <p className="text-sm text-muted-foreground">Cria um novo chamado dentro do seu contrato AMS</p>
        </div>
      <Card className="w-full">
        <CardContent>
          <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Projeto</label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => handleSelect("project_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parceiro</label>
                <Select
                  value={form.partner_id}
                  onValueChange={(v) => handleSelect("partner_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo Chamado</label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => handleSelect("category_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Módulo Associado</label>
                <Select
                  value={form.module_id}
                  onValueChange={(v) => handleSelect("module_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={String(m.id)} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <Select
                  value={form.priority_id}
                  onValueChange={(v) => handleSelect("priority_id", v)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição do Chamado</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full h-48 border rounded p-2"
              />
            </div>
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
              <div className="md:col-span-2 flex gap-4 items-end">
                <div className="w-1/6">
                  <label className="block text-sm font-medium mb-1">Tipo do Anexo</label>
                  <Select
                    value={attachmentType}
                    onValueChange={handleAttachmentType}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo do anexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Evidencia de Erro">Evidência de Erro</SelectItem>
                      <SelectItem value="Evidencia de Teste">Evidência de Teste</SelectItem>
                      <SelectItem value="Especificação">Especificação</SelectItem>
                      <SelectItem value="Detalhamento de Chamado">Detalhamento de Chamado</SelectItem>
                      <SelectItem value="Arquivo Contratual">Arquivo Contratual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium mb-1">Anexo</label>
                  <Input
                    type="file"
                    accept="*"
                    onChange={handleFile}
                    disabled={loading}
                  />
                  {form.attachment && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Arquivo selecionado: {form.attachment.name}
                    </div>
                  )}
                </div>
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
                onClick={() =>
                  setForm({
                    project_id: "",
                    partner_id: "",
                    title: "",
                    category_id: "",
                    module_id: "",
                    priority_id: "",
                    description: "",
                    attachment: null,
                  })
                }
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