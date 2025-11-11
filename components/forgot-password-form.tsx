"use client";

import { cn } from "@/lib/utils";
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
import { useState } from "react";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onForgotPassword?: () => void;
  onBack?: () => void;
}

export function ForgotPasswordForm({
  className,
  onBack,
  ...props
}: React.ComponentPropsWithoutRef<"div">&LoginFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao enviar email");

      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={cn("flex flex-col gap-6 max-w-sm w-full", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
            <CardDescription>Instruções de redefinição de senha enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Se você se registrou usando seu email e senha, você receberá
              um email de redefinição de senha.
            </p>
            <div className="mt-4 text-center text-sm">
              <Button
                type="button"
                onClick={onBack}
                variant="link"
                className="p-0 underline underline-offset-4"
              >
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir sua Senha</CardTitle>
            <CardDescription>
              Digite seu email e, se ele existir, enviaremos um link para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar email de redefinição"}
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{" "}
              <Button
                type="button"
                onClick={onBack}
                variant="link"
                className="p-0 underline underline-offset-4"
              >
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
