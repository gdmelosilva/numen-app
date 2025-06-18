import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  partnerId: string;
  onCreated?: () => void;
  categories: { id: string; name: string; description?: string }[];
  modules: { id: string; name: string; description?: string }[];
  priorities: { id: string; name: string }[];
  isAms?: boolean;
}

export default function CreateActivityDialog({ open, onOpenChange, projectId, partnerId, onCreated, categories, modules, priorities, isAms = false }: CreateTicketDialogProps) {
  console.log('CreateActivityDialog - isAms:', isAms); // DEBUG
  const [tab, setTab] = useState('dados');
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    module_id: '',
    priority_id: '',
    description: '',
    attachment: null as File | null,
  });
  const [attachmentType, setAttachmentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    // Log dos valores enviados para debug
    console.log('DEBUG SUBMIT:', {
      projectId,
      partnerId,
      ...form
    });
    setError(null);    // Validação local dos campos obrigatórios
    const requiredFieldsValid = !projectId || !partnerId || !form.title || 
      (!isAms && !form.category_id) || !form.module_id || !form.priority_id || !form.description;
    
    if (requiredFieldsValid) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      let ticketId: string | null = null;
      let ticketRes, ticketData;
      // Criação do chamado (sempre pega o retorno do ticket)
      if (form.attachment) {
        const fd = new FormData();        fd.append('contractId', projectId);
        fd.append('partner_id', partnerId);
        fd.append('title', form.title);
        if (!isAms && form.category_id) {
          fd.append('category_id', form.category_id);
        }
        fd.append('module_id', form.module_id);
        fd.append('priority_id', form.priority_id);
        fd.append('description', form.description);
        fd.append('type_id', '2');
        // Não envia o arquivo ainda
        ticketRes = await fetch('/api/tickets/create', {
          method: 'POST',
          body: fd,
        });
        if (!ticketRes.ok) {
          const data = await ticketRes.json();
          throw new Error(data.error || 'Erro ao criar atividade');
        }
        ticketData = await ticketRes.json();
        ticketId = ticketData?.id || ticketData?.data?.id;
      } else {        const requestBody: Record<string, string> = {
          contractId: projectId,
          partner_id: partnerId,
          title: form.title,
          module_id: form.module_id,
          priority_id: form.priority_id,
          description: form.description,
        };
        
        if (!isAms && form.category_id) {
          requestBody.category_id = form.category_id;
        }
        
        ticketRes = await fetch('/api/tickets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!ticketRes.ok) {
          const data = await ticketRes.json();
          throw new Error(data.error || 'Erro ao criar a atividade');
        }
        ticketData = await ticketRes.json();
        ticketId = ticketData?.id || ticketData?.data?.id;
      }
      // Se houver anexo, faz o upload vinculado à primeira mensagem do ticket
      if (form.attachment && ticketId) {
        // Busca mensagens do ticket
        const msgRes = await fetch(`/api/messages?ticket_id=${ticketId}`);
        if (!msgRes.ok) throw new Error('Erro ao buscar mensagem da atividade');
        const msgs = await msgRes.json();
        const systemMsg = Array.isArray(msgs) && msgs.length > 0 ? msgs[0] : null;
        if (!systemMsg?.id) throw new Error('Mensagem do sistema não encontrada');
        // Envia o anexo para o endpoint correto
        const attFd = new FormData();
        attFd.append('file', form.attachment);
        attFd.append('messageId', systemMsg.id);
        attFd.append('ticketId', ticketId);
        if (attachmentType) attFd.append('att_type', attachmentType);
        const attRes = await fetch('/api/attachment', {
          method: 'POST',
          body: attFd,
        });
        if (!attRes.ok) {
          const data = await attRes.json();
          throw new Error(data.error || 'Erro ao enviar anexo');
        }
      }
      toast.success('Atividade criada com sucesso.');
      setForm({ title: '', category_id: '', module_id: '', priority_id: '', description: '', attachment: null });
      setAttachmentType('');
      onOpenChange(false);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir Atividade</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="anexo">Anexo</TabsTrigger>
          </TabsList>
          <TabsContent value="dados">
            <form className="space-y-4" onSubmit={handleSubmit}>              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input name="title" value={form.title} onChange={handleChange} required disabled={loading} />
              </div>
              {/* DEBUG: isAms = {JSON.stringify(isAms)} */}
              {!isAms && (
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Atividade</label>
                  <Select value={form.category_id} onValueChange={v => handleSelect('category_id', v)} disabled={loading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Módulo Associado</label>
                <Select value={form.module_id} onValueChange={v => handleSelect('module_id', v)} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map(m => (
                      <SelectItem key={String(m.id)} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <Select value={form.priority_id} onValueChange={v => handleSelect('priority_id', v)} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={String(p.id)} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição da Atividade</label>
                <textarea name="description" value={form.description} onChange={handleChange} required disabled={loading} className="w-full h-24 border rounded p-2" />
              </div>
              {error && <div className="text-destructive text-sm">{error}</div>}
              <DialogFooter>
                <Button type="submit" variant="colored2" disabled={loading}>{loading ? 'Enviando...' : 'Criar Atividade'}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="anexo">
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Tipo do Anexo</label>
              <Select value={attachmentType} onValueChange={handleAttachmentType} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo do anexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evidencia de Erro">Evidência de Erro</SelectItem>
                  <SelectItem value="Evidencia de Teste">Evidência de Teste</SelectItem>
                  <SelectItem value="Especificação">Especificação</SelectItem>
                  <SelectItem value="Detalhamento da Atividade">Detalhamento da Atividade</SelectItem>
                  <SelectItem value="Arquivo Contratual">Arquivo Contratual</SelectItem>
                </SelectContent>
              </Select>
              <label className="block text-sm font-medium mb-1">Anexo</label>
              <Input type="file" accept="*" onChange={handleFile} disabled={loading} />
              {form.attachment && <div className="text-xs text-muted-foreground">Arquivo selecionado: {form.attachment.name}</div>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
