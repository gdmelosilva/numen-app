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
import { useEffect, useRef, useState } from "react";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onForgotPassword?: () => void;
  onResetPassword?: () => void;
}

export function LoginForm({
  className,
  onForgotPassword,
  onResetPassword,
  ...props
}: React.ComponentPropsWithoutRef<"div">&LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      });
      if (error) {
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Credenciais de login inválidas")
      ) {
        setError("Credenciais inválidas. Verifique seu email e senha.");
      } else {
        setError(error.message);
      }
      return;
      }
      router.push("/main");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
    };

  return (
    <div className={cn("flex flex-col gap-6 max-w-sm w-full ", className)} {...props}>
      <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">Entrar</CardTitle>
        <CardDescription className="text-center">
        Bem-vindo a Numen Lean Services!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
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
            ref={emailInputRef}
          />
          </div>
          <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            {/* <Link
            href="/auth/forgot-password"
            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
            Forgot your password?
            </Link> */}
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
          />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </div>
          </form>
        <div className="mt-4 mb-0 text-center text-sm">
          <Button
            onClick={onForgotPassword}
            variant="link"
            className="text-sm underline-offset-4 hover:underline p-0"
          >
            Esqueceu sua Senha?
          </Button>
        </div>
        <div className="text-center text-sm">
          <Button
            onClick={onResetPassword}
            variant="link"
            className="text-sm underline-offset-4 hover:underline p-0"
          >
            Tem um Token de Redefinição?
          </Button>
        </div>
        <div className="mt-2"></div>
      </CardContent>
      </Card>
    </div>
  );
}
