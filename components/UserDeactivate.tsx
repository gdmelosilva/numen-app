"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UserDeactivateProps {
  userId: string;
  currentStatus: boolean;
}

export function UserDeactivate({ userId, currentStatus }: UserDeactivateProps) {
  const [isActive, setIsActive] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const updateUserStatus = async (newStatus: boolean) => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({ active: newStatus })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setIsActive(newStatus);
      toast.success(`Usuário ${newStatus ? "ativado" : "desativado"} com sucesso!`);
      return true;
    } catch {
      toast.error("Erro ao atualizar status do usuário");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isActive, isLoading, updateUserStatus };
} 