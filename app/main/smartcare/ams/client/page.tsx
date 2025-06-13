"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type AMSProject = {
  id: string;
  // Add other relevant fields here as needed, e.g. name: string;
};

export default function AMSClientPage() {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<AMSProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAMSProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/smartcare/ams-projects");
        if (!res.ok) throw new Error("Erro ao buscar projeto AMS");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProject(data[0]);
          // Redireciona para a página de detalhes do projeto AMS
          router.replace(`/main/smartcare/ams/${data[0].id}`);
        } else {
          setProject(null);
        }
      } catch {
        setError("Erro ao buscar projeto AMS");
      } finally {
        setLoading(false);
      }
    };
    fetchAMSProject();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-destructive">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">
              Ainda não há contratos AMS para este usuário.
            </h2>
            <p className="text-muted-foreground">
              Para mais informações entre em contato conosco.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se houver projeto, já terá redirecionado
  return null;
}