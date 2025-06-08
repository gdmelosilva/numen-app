"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onForgotPassword?: () => void;
  onBack?: () => void;
  onSignUp?: () => void;
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">&LoginFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: res, error: error } = await supabase.auth.signUp({
        email,
        password: 'Numen@2025',
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
      if (res) {
        const createdUser = res.user;
        if (!createdUser) {
          throw new Error("Usuário não criado");
        } else {
          try{
            await supabase.from('users').insert({
            id: createdUser.id,
            first_name: firstName,
            last_name: lastName,
            email: createdUser.email,
            is_client: isClient,
            tel_contact: telephone,
            role: role,
            partner_id: partnerId || null,
          })
        } catch (error) {
          console.error("Erro ao inserir usuário:", error);
          setError("Erro ao criar usuário no banco de dados");
        }
      }}
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  type="first_name"
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
                  type="last_name"
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
                <Label 
                  htmlFor="is_client" 
                  className={cn(
                  "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200",
                  isClient ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
                  )}
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
                  <Input
                  id="is_client"
                  type="checkbox"
                  className="sr-only"
                  checked={isClient}
                  onChange={(e) => setIsClient(e.target.checked)}
                  />
                </Label>
                </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Função</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner">Parceiro</Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui serão adicionados os parceiros via API */}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
