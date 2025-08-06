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
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // A URL que será incluída no email. Esta URL precisa ser configurada nas URLs de redirecionamento no painel do Supabase em https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir sua Senha</CardTitle>
            <CardDescription>
              Digite seu email e enviaremos um link para redefinir sua
              senha
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
                    onChange={(e) => setEmail(e.target.value)}
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
