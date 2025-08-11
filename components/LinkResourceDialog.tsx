import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Ticket } from "@/types/tickets";

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_functional_name?: string;
  ticket_module?: string;
}

interface LinkResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onSuccess?: () => void;
}

export function LinkResourceDialog({ open, onOpenChange, ticket, onSuccess }: LinkResourceDialogProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [availableLoading, setAvailableLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  // Estados para paginação
  const [currentResourcePage, setCurrentResourcePage] = useState(1);
  const resourcesPerPage = 8;

  // Busca usuários disponíveis para vínculo
  const fetchAvailableUsers = useCallback(async () => {
    if (!ticket?.project_id) return;
    setAvailableLoading(true);
    setResourceError(null);
    try {
      // Busca recursos do projeto (que já retorna os usuários vinculados)
      const res = await fetch(`/api/project-resources?project_id=${ticket.project_id}`);
      if (!res.ok) throw new Error("Erro ao buscar recursos do projeto");
      const data = await res.json();
      
      // Extrair os usuários dos recursos do projeto
      const users: User[] = Array.isArray(data) ? data.map((resource: {
        user_id?: string;
        id?: string;
        user?: {
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        first_name?: string;
        last_name?: string;
        email?: string;
        user_functional?: {
          name?: string;
        };
        user_functional_name?: string;
        ticket_module?: string;
      }) => ({
        id: resource.user_id || resource.id || '',
        first_name: resource.user?.first_name || resource.first_name,
        last_name: resource.user?.last_name || resource.last_name,
        email: resource.user?.email || resource.email,
        user_functional_name: resource.user_functional?.name || resource.user_functional_name,
        ticket_module: resource.ticket_module,
      })).filter(user => user.id && user.email) as User[] : [];
      
      setAvailableUsers(users);
    } catch {
      setResourceError("Erro ao buscar usuários disponíveis");
      setAvailableUsers([]);
    } finally {
      setAvailableLoading(false);
    }
  }, [ticket?.project_id]);

  // Filtrar usuários baseado na busca
  const filteredUsers = availableUsers.filter(user => {
    const searchLower = searchUser.toLowerCase().trim();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Paginação dos recursos
  const totalResources = filteredUsers.length;
  const totalResourcePages = Math.ceil(totalResources / resourcesPerPage);
  const currentResources = filteredUsers.slice(
    (currentResourcePage - 1) * resourcesPerPage,
    currentResourcePage * resourcesPerPage
  );

  // Reset da página quando a busca muda
  useEffect(() => {
    setCurrentResourcePage(1);
  }, [searchUser]);

  // Carregar usuários quando o dialog abre
  useEffect(() => {
    if (open && ticket) {
      fetchAvailableUsers();
      setSearchUser("");
      setCurrentResourcePage(1);
    }
  }, [open, ticket, fetchAvailableUsers]);

  const handleLinkAndForward = async (user: User) => {
    if (!ticket) return;
    
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    // Exibir toast de "vinculando"
    const linkingToast = toast.loading(`Vinculando recurso ${userName}...`);
    
    setLinking(true);
    try {
      // 1. Vincular usuário ao ticket
      await fetch("/api/ticket-resources/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticket.id, user_id: user.id })
      });

      // 2. Tornar o usuário responsável principal
      await fetch("/api/ticket-resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, ticket_id: ticket.id, is_main: true })
      });

      // 3. Atualizar status do ticket para "Em Atendimento" (status_id: 3)
      await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticket.id, status_id: "3" })
      });

      // Fechar dialog e atualizar lista
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Substituir o toast de loading por um de sucesso
      toast.success(`Recurso ${userName} vinculado e chamado encaminhado com sucesso!`, {
        id: linkingToast
      });
      
      // 4. Enviar e-mail de notificação em background (não bloqueia a interface)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          ticket_id: ticket.id, 
          email: user.email, 
          name: userName 
        })
      }).catch(error => {
        console.error('Erro ao enviar e-mail:', error);
        // Toast opcional para informar sobre erro no e-mail, mas não bloqueia o fluxo
        toast.warning('Recurso vinculado com sucesso, mas houve erro ao enviar e-mail de notificação.');
      });
      
    } catch (error) {
      console.error('Erro ao vincular recurso:', error);
      
      // Substituir o toast de loading por um de erro
      toast.error("Erro ao vincular recurso e encaminhar chamado.", {
        id: linkingToast
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vincular Recurso ao Chamado #{ticket?.external_id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              disabled={availableLoading}
            />
          </div>

          {availableLoading ? (
            <div className="text-muted-foreground text-sm">Carregando usuários...</div>
          ) : resourceError ? (
            <div className="text-destructive text-sm">{resourceError}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-muted-foreground text-sm italic">
              {searchUser ? "Nenhum usuário encontrado para o termo pesquisado." : "Nenhum usuário disponível para vínculo."}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Informações da paginação */}
              {totalResourcePages > 1 && (
                <div className="text-xs text-muted-foreground">
                  Mostrando {currentResources.length} de {totalResources} usuários
                </div>
              )}
              
              {/* Tabela */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="w-[140px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody style={{ minHeight: `${resourcesPerPage * 60}px` }}>
                    {currentResources.map(user => (
                      <TableRow key={user.id} className="h-[60px]">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.first_name} {user.last_name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.user_functional_name || user.ticket_module ? (
                            <span className="text-sm">
                              {user.user_functional_name || user.ticket_module}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="colored2"
                            onClick={() => handleLinkAndForward(user)}
                            disabled={linking}
                          >
                            {linking ? "Vinculando..." : "Vincular & Encaminhar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Linhas vazias para manter altura fixa */}
                    {Array.from({ length: resourcesPerPage - currentResources.length }, (_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[60px]">
                        <TableCell className="text-transparent">.</TableCell>
                        <TableCell className="text-transparent">.</TableCell>
                        <TableCell className="text-transparent">.</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Controles de paginação */}
              {totalResourcePages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Página {currentResourcePage} de {totalResourcePages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentResourcePage(prev => Math.max(1, prev - 1))}
                      disabled={currentResourcePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentResourcePage(prev => Math.min(totalResourcePages, prev + 1))}
                      disabled={currentResourcePage === totalResourcePages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
