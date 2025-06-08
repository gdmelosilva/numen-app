"use client";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm onBack={() => router.push("/auth/login")} />
      </div>
    </div>
  );
}
