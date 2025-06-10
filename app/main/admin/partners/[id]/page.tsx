import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Partner } from "@/types/partners";

async function getPartner(id: string): Promise<Partner | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/partner?id=eq.${id}`, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
}

export default async function PartnerDetailsPage({ params }: { params: { id: string } }) {
  const partner = await getPartner(params.id);
  if (!partner) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Parceiro</h1>
      <div className="space-y-4">
        <div>
          <span className="font-semibold">Nome: </span>{partner.partner_desc}
        </div>
        <div>
          <span className="font-semibold">Identificação: </span>{partner.partner_ident}
        </div>
        <div>
          <span className="font-semibold">Email: </span>{partner.partner_email}
        </div>
        <div>
          <span className="font-semibold">Telefone: </span>{partner.partner_tel}
        </div>
        <div>
          <span className="font-semibold">Segmento: </span>{partner.partner_segment?.name || '-'}
        </div>
        <div>
          <span className="font-semibold">Tipo: </span>
          <Badge variant={partner.is_compadm ? "default" : "secondary"}>
            {partner.is_compadm ? "Administrativo" : "Cliente"}
          </Badge>
        </div>
        <div>
          <span className="font-semibold">Status: </span>
          <Badge variant={partner.is_active ? "approved" : "destructive"}>
            {partner.is_active ? (
              <CheckCircle2 className="mr-1 h-3 w-3 inline" />
            ) : (
              <XCircle className="mr-1 h-3 w-3 inline" />
            )}
            {partner.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
