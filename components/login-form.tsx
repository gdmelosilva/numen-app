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
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onForgotPassword?: () => void;
}

export function LoginForm({
  className,
  onForgotPassword,
  ...props
}: React.ComponentPropsWithoutRef<"div">&LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('easytime-remember-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
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

      if (rememberEmail) {
        localStorage.setItem('easytime-remember-email', email);
      } else {
        localStorage.removeItem('easytime-remember-email');
      }

      router.push("/main");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }
    };
    const cliente = "!"

  return (
    <div className={cn("flex flex-col gap-6 max-w-sm w-full ", className)} {...props}>
      <Card>
      <CardHeader>
        <Image
          src="/ÍCONE AZUL E LARANJA.svg"
          alt="Logo"
          width={50}
          height={50}
          className="mb-4"
        />
        <CardTitle className="text-start text-2xl font-extrabold">Entrar</CardTitle>
        <CardDescription className="text-start">
        Bem-vindo ao EasyTime{cliente}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} id="login-form">
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-500">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              className="border-0 border-b-2 border-b-[#233549] rounded-sm bg-gray-50"
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  handleLogin(syntheticEvent);
                }
              }}
              ref={emailInputRef}
            />
            </div>
            <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-gray-500">Senha</Label>
              {/* <Link
              href="/auth/forgot-password"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
              Forgot your password?
              </Link> */}
            </div>
            <div className="relative">
              <Input
                id="password"
                placeholder="Senha"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                className="border-0 border-b-2 border-b-[#233549]  rounded-sm bg-gray-50 pr-10"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleLogin(syntheticEvent);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-[#233549]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-between mt-0 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-email"
                  className="rounded-[4px]"
                  checked={rememberEmail}
                  onCheckedChange={(checked) => setRememberEmail(checked as boolean)}
                />
                <Label 
                  htmlFor="remember-email" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lembrar meu email
                </Label>
              </div>
                <Button
                  onClick={onForgotPassword}
                  variant="link"
                  className="text-sm underline-offset-4 hover:underline p-0"
                >
                  Esqueceu sua Senha?
                </Button>
            </div>
          </div>
        </form>

        <div className="mt-2 bg-transparent m-[-40px] p-0 h-20">        
          <Button 
              type="submit"
              className="w-full h-full font-extrabold pb-6"
              variant={"default"}
              form="login-form"
              disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
