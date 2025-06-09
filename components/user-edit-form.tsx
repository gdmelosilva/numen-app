"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/types/roles";
import { getRoleOptions } from "@/hooks/useOptions";
import type { User } from "@/types/users";

interface UserEditFormProps extends React.ComponentPropsWithoutRef<"div"> {
  user: User;
  onSuccess?: () => void;
}

const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 0) {
    return "";
  } else if(cleaned.length <= 2) {
    return `(${cleaned}`;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
};

export function UserEditForm({ user, className, onSuccess, ...props }: UserEditFormProps) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [telephone, setTelephone] = useState(user.tel_contact || "");
  const [isClient] = useState(user.is_client || false);
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(user.role ? user.role.toString() : "");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const roleData = await getRoleOptions();
        setRoles(roleData || []);
      } catch {
        setRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          telephone,
          role,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-2xl">Editar Usuário</CardTitle>
        <CardDescription>Altere os dados do usuário abaixo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEdit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="John"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Doe da Silva"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tel_contact">Telefone</Label>
              <Input
                id="tel_contact"
                type="text"
                placeholder="(27) 99988-7777"
                required
                value={formatPhoneNumber(telephone)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setTelephone(cleaned);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRoles ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    roles
                      .filter((option: Role) => option.id)
                      .map((option: Role) => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          {option.title}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partner">Parceiro</Label>
              <Input
                id="partner"
                value={user.partner_desc || ""}
                disabled
                placeholder="Sem parceiro"
              />
            </div>
          </div>
          <div className="mt-4">
            <label
              htmlFor="is_client"
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg cursor-not-allowed opacity-70 transition-all duration-200 select-none",
                isClient ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
              )}
              tabIndex={-1}
              aria-disabled
            >
              <span>Usuário Cliente</span>
              <div className={cn(
                "w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all duration-200",
                isClient ? "border-primary-foreground bg-primary-foreground" : "border-muted-foreground"
              )}>
                {isClient && (
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <input
                id="is_client"
                type="checkbox"
                className="sr-only"
                checked={isClient}
                readOnly
                tabIndex={-1}
                disabled
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
