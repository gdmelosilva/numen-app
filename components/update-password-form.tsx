"use client";

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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.getSession();
      if (error) {
        setError("Link inválido ou expirado");
        console.error("Auth error:", error);
      }
    };

    handleAuthCallback();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    // Nova verificação: pelo menos 1 caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("A senha deve conter pelo menos 1 caractere especial");
      return;
    }

    // Nova verificação: pelo menos 1 letra maiúscula
    if (!/[A-Z]/.test(password)) {
      setError("A senha deve conter pelo menos 1 letra maiúscula");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess("Senha atualizada com sucesso!");

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Falha ao atualizar a senha"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-sm w-full", className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Definir Senha
          </CardTitle>
          <CardDescription className="text-center">
            Defina uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
