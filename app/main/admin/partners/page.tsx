"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Partner {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/partners");
        if (!response.ok) {
          throw new Error("Falha ao carregar parceiros");
        }
        const data = await response.json();
        setPartners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parceiros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">{partner.email}</p>
              </div>
              <span className="text-sm text-muted-foreground">{partner.status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 