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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'email' | 'token'>('email');
  const router = useRouter();

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

  const handleResetWithToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast.error("Por favor, insira o token de redefinição");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

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

      toast.success("Senha redefinida com sucesso! Redirecionando para o login...");

      // Redirecionar para a página principal para fazer login
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Falha ao redefinir a senha";
      setError(errorMessage);
      toast.error(errorMessage);
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
                onClick={() => {
                  setSuccess(false);
                  setMode('token');
                }}
                variant="link"
                className="p-0 underline underline-offset-4"
              >
                Já tenho um token de redefinição
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === 'email' ? 'Redefinir sua Senha' : 'Redefinir Senha com Token'}
            </CardTitle>
            <CardDescription>
              {mode === 'email' 
                ? 'Digite seu email e enviaremos um link para redefinir sua senha'
                : 'Digite o token recebido por email e sua nova senha'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-2">
              <Button
                type="button"
                variant={mode === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('email')}
                className="flex-1"
              >
                Enviar Email
              </Button>
              <Button
                type="button"
                variant={mode === 'token' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('token')}
                className="flex-1"
              >
                Tenho Token
              </Button>
            </div>

            {mode === 'email' ? (
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
            ) : (
              <form onSubmit={handleResetWithToken}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="token">Token de Redefinição</Label>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <button 
                              type="button" 
                              className="inline-flex items-center justify-center ml-1"
                              aria-label="Informação sobre token de redefinição"
                            >
                              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs p-3">
                            <div className="text-sm">
                              <p className="font-medium mb-1">💡 Dica</p>
                              <p>Copie o token do email de redefinição e cole abaixo.</p>
                              <p className="mt-1">Se você clicou no link do email, use a opção &quot;Enviar Email&quot; acima.</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>
                </div>
              </form>
            )}
            
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
