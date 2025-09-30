"use client"

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserContext } from "@/components/user-context";
import { User, Mail, Building2, Edit, Phone, Key } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ExtendedUser {
  id: string;
  email: string;
  role: number;
  partner_id?: string | null;
  is_active: boolean;
  is_client: boolean;
  first_name: string;
  last_name: string;
  tel_contact?: string | null;
  partner_desc?: string | null;
}

export default function ProfileDialog() {
  const { isProfileDialogOpen, setProfileDialogOpen } = useUserContext();
  const [user, setUser] = React.useState<ExtendedUser | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    first_name: '',
    last_name: '',
    tel_contact: ''
  });

  // Buscar dados completos do usuário quando o dialog abrir
  React.useEffect(() => {
    if (isProfileDialogOpen) {
      fetchUserData();
    }
  }, [isProfileDialogOpen]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('user')
          .select(`
            id,
            first_name,
            last_name,
            email,
            is_client,
            tel_contact,
            partner_id,
            role,
            partner_desc: users_partner_id_fkey(
              partner_desc
            ),
            is_active
          `)
          .eq('id', authUser.id)
          .single();
        
        // Flatten partner_desc if it comes as nested object
        let partnerDesc: string | null = null;
        if (userData?.partner_desc) {
          if (typeof userData.partner_desc === 'string') {
            partnerDesc = userData.partner_desc;
          } else if (typeof userData.partner_desc === 'object' && 'partner_desc' in userData.partner_desc) {
            partnerDesc = (userData.partner_desc as { partner_desc?: string }).partner_desc ?? null;
          }
        }
        
        const userWithPartnerDesc: ExtendedUser | null = userData ? {
          ...userData,
          partner_desc: partnerDesc,
        } : null;
        
        setUser(userWithPartnerDesc);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função utilitária para exibir o nome do cargo
  function roleToLabel(role: number | string | null | undefined, is_client: boolean) {
    const roleNum = typeof role === 'string' ? parseInt(role, 10) : role;
    
    if (roleNum === 1) return "Administrador";
    if (roleNum === 2) return "Gerente";
    if (roleNum === 3 && is_client === true) return "Key-User";
    if (roleNum === 3 && is_client === false) return "Funcional";
    
    return "Cargo Indefinido";
  }

  // Gera as iniciais do usuário
  function getUserInitials() {
    if (!user) return "UN";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.last_name) return user.last_name[0].toUpperCase();
    return "UN";
  }

  // Gera o nome completo do usuário
  function getUserFullName() {
    if (!user) return "Usuário";
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return name || "Usuário";
  }

  // Iniciar edição
  const handleEditStart = () => {
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        tel_contact: user.tel_contact || ''
      });
      setIsEditing(true);
    }
  };

  // Cancelar edição
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({ first_name: '', last_name: '', tel_contact: '' });
  };

  // Fechar dialog e resetar estado
  const handleDialogClose = () => {
    setIsEditing(false);
    setEditForm({ first_name: '', last_name: '', tel_contact: '' });
    setProfileDialogOpen(false);
  };

  // Salvar edição
  const handleEditSave = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          tel_contact: editForm.tel_contact || null
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        return;
      }

      // Atualizar dados locais
      setUser({
        ...user,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        tel_contact: editForm.tel_contact || null
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Alterar senha
  const handleChangePassword = () => {
    // Fechar o dialog atual
    setProfileDialogOpen(false);
    // Redirecionar para a página de alteração de senha
    window.location.href = '/auth/update-password';
  };

  return (
    <Dialog open={isProfileDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Usuário
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-16 w-16 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ) : !user ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Não foi possível carregar as informações do usuário.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar e Nome */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {getUserInitials()}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{getUserFullName()}</h3>
                <div className="flex items-center gap-2">
                  {/* <ColoredBadge value={user.is_active} type="status" /> */}
                  <ColoredBadge value={user.is_client} type="is_client" />
                  <ColoredBadge value={roleToLabel(user.role, user.is_client)} type="user_role" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações do usuário */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-sm font-medium">Nome</Label>
                      <Input
                        id="first_name"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-sm font-medium">Sobrenome</Label>
                      <Input
                        id="last_name"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                        placeholder="Sobrenome"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tel_contact" className="text-sm font-medium">Telefone</Label>
                    <Input
                      id="tel_contact"
                      value={editForm.tel_contact}
                      onChange={(e) => setEditForm({...editForm, tel_contact: e.target.value})}
                      placeholder="Telefone"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nome Completo</p>
                      <p className="text-sm text-muted-foreground">{getUserFullName()}</p>
                    </div>
                  </div>

                  {user.tel_contact && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telefone</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPhoneNumber(user.tel_contact)}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {user.partner_desc && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Parceiro</p>
                    <p className="text-sm text-muted-foreground">{user.partner_desc}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Ações */}
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handleChangePassword}>
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
              
              <div className="flex gap-2">
                {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditCancel}
                    className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleEditSave}>
                    Salvar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleEditStart}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleDialogClose}
                  >
                    Fechar
                  </Button>
                </>
              )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}