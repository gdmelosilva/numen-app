import { ResetPasswordForm } from "@/components/reset-password-form";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <ResetPasswordForm />
      <div className="mt-6 text-center text-sm">
        <Link href="/auth" className="underline underline-offset-4 text-muted-foreground hover:text-foreground">
          Voltar ao Login
        </Link>
      </div>
    </div>
  );
}
