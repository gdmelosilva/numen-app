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

interface ResetPasswordFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onBack?: () => void;
}

export function ResetPasswordForm({
  className,
  onBack,
  ...props
}: ResetPasswordFormProps) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [mode, setMode] = useState<'session' | 'token' | 'auto'>('auto');
  const router = useRouter();

  useEffect(() => {
    // Verificar se há uma sessão ativa (usuário veio do link do email)
    const checkSession = async () => {
      const supabase = createClient();
      
      try {
        // Verificar se já existe uma sessão válida
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
          setMode('session');
        } else {
          setMode('token');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setMode('token');
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "A senha deve conter pelo menos 1 caractere especial";
    }

    if (!/[A-Z]/.test(password)) {
      return "A senha deve conter pelo menos 1 letra maiúscula";
    }

    return null;
  };

  const handleResetWithToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError("Por favor, insira o token de redefinição");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Usar o token para redefinir a senha
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        throw new Error("Token inválido ou expirado");
      }

      // Após verificar o token, atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess("Senha redefinida com sucesso! Redirecionando para o login...");

      // Redirecionar para a página principal para fazer login
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Falha ao redefinir a senha"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
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

      setSuccess("Senha redefinida com sucesso! Redirecionando para o login...");

      // Redirecionar para a página principal para fazer login
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Falha ao redefinir a senha"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (hasValidSession) {
      return "Redefinir Senha";
    }
    return "Redefinir Senha com Token";
  };

  const getDescription = () => {
    if (hasValidSession) {
      return "Defina uma nova senha para sua conta";
    }
    return "Digite o token recebido por email e sua nova senha";
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-sm w-full", className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasValidSession && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Dica:</strong> Se você clicou no link do email, use a opção &quot;Redefinir com Link&quot;. 
                Caso contrário, copie o token do email e cole abaixo.
              </p>
            </div>
          )}
          
          {!hasValidSession && (
            <div className="mb-6 flex gap-2">
              <Button
                type="button"
                variant={mode === 'token' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('token')}
                className="flex-1"
              >
                Token Manual
              </Button>
              <Button
                type="button"
                variant={mode === 'session' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('session')}
                className="flex-1"
              >
                Redefinir com Link
              </Button>
            </div>
          )}

          <form onSubmit={hasValidSession || mode === 'session' ? handleResetWithSession : handleResetWithToken}>
            <div className="flex flex-col gap-6">
              {!hasValidSession && mode === 'token' && (
                <div className="grid gap-2">
                  <Label htmlFor="token">Token de Redefinição</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Cole aqui o token do email"
                    required
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Copie o token do email de redefinição
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Pelo menos 1 letra maiúscula</li>
                  <li>Pelo menos 1 caractere especial</li>
                </ul>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </div>
          </form>
          
          {onBack && (
            <div className="mt-4 text-center text-sm">
              <Button
                type="button"
                onClick={onBack}
                variant="link"
                className="p-0 underline underline-offset-4"
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
