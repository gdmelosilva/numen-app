"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Pencil, Loader2 } from "lucide-react";
import type { Partner } from "@/types/partners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { getMarketSegments } from "@/hooks/useOptions";
import type { MarketingInterface } from "@/types/marketing_segments";
import { formatCpfCnpj, formatPhoneNumber } from "@/lib/utils";

async function getPartner(id: string): Promise<PartnerWithUsers | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/partners?id=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  const partner = data[0] || null;
  if (!partner) return null;
  // Fetch users for this partner (filtrando já na query)
  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/users?partner_id=${id}`);
  const users = usersRes.ok ? await usersRes.json() : [];
  partner.users = users;
  return partner;
}

interface PartnerWithUsers extends Partner {
  users: Array<{
    first_name: string;
    last_name: string;
    email: string;
    tel_contact: string | null;
    is_active: boolean;
    role: number;
    is_client: boolean;
  }>;
}

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tel_contact: string | null;
  is_active: boolean;
  role: number;
  is_client: boolean;
};

const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "first_name",
    header: "Nome",
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "tel_contact",
    header: "Telefone",
    cell: ({ row }) => row.original.tel_contact || "-",
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) =>
      row.original.role === 1
        ? "Administrador"
        : row.original.role === 2
        ? "Gerente"
        : row.original.is_client
        ? "Key-User"
        : "Funcional",
  },
  {
    accessorKey: "is_client",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge variant={row.original.is_client ? "secondary" : "default"}>
        {row.original.is_client ? "Cliente" : "Administrativo"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "approved" : "destructive"}>
        {row.original.is_active ? (
          <CheckCircle2 className="mr-1 h-3 w-3 inline" />
        ) : (
          <XCircle className="mr-1 h-3 w-3 inline" />
        )}
        {row.original.is_active ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

interface PartnerDetailsClientProps {
  partnerId: string;
}

export default function PartnerDetailsClient({ partnerId }: PartnerDetailsClientProps) {
  const [partner, setPartner] = useState<PartnerWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    partner_desc: "",
    partner_ident: "",
    partner_email: "",
    partner_tel: "",
    partner_mkt_sg: { id: "", name: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const [marketSegments, setMarketSegments] = useState<MarketingInterface[]>([]);

  // Fetch market segments and partner data on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [segments, p] = await Promise.all([
          getMarketSegments(),
          getPartner(partnerId),
        ]);
        if (!p) throw new Error("Erro ao buscar parceiro");
        if (isMounted) {
          setMarketSegments(segments || []);
          setPartner(p);
          // Find the segment in marketSegments by name to get its id
          let segment: MarketingInterface | undefined = undefined;
          if (p.partner_segment?.name && segments && segments.length > 0) {
            segment = segments.find((s: MarketingInterface) => s.name === p.partner_segment.name);
          }
          setForm({
            partner_desc: p.partner_desc,
            partner_ident: p.partner_ident,
            partner_email: p.partner_email,
            partner_tel: p.partner_tel,
            partner_mkt_sg: segment
              ? { id: segment.id.toString(), name: segment.name }
              : { id: "", name: p.partner_segment?.name || "" },
          });
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [partnerId]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    if (partner) {
      let segment: MarketingInterface | undefined = undefined;
      if (partner.partner_segment?.name && marketSegments.length > 0) {
        segment = marketSegments.find((s: MarketingInterface) => s.name === partner.partner_segment.name);
      }
      setForm({
        partner_desc: partner.partner_desc,
        partner_ident: partner.partner_ident,
        partner_email: partner.partner_email,
        partner_tel: partner.partner_tel,
        partner_mkt_sg: segment ? { id: segment.id.toString(), name: segment.name } : { id: "", name: partner.partner_segment?.name || "" },
      });
    }
    setEditMode(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_desc: form.partner_desc,
          partner_ident: form.partner_ident,
          partner_email: form.partner_email,
          partner_tel: form.partner_tel,
          partner_mkt_sg: form.partner_mkt_sg.id ? Number(form.partner_mkt_sg.id) : null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar parceiro');
      }
      setEditMode(false);
      // Refetch partner data after save
      setLoading(true);
      setError(null);
      const p = await getPartner(partnerId);
      if (!p) throw new Error("Erro ao buscar parceiro");
      setPartner(p);
      let segment: MarketingInterface | undefined = undefined;
      if (p.partner_segment?.name && marketSegments.length > 0) {
        segment = marketSegments.find((s: MarketingInterface) => s.name === p.partner_segment.name);
      }
      setForm({
        partner_desc: p.partner_desc,
        partner_ident: p.partner_ident,
        partner_email: p.partner_email,
        partner_tel: p.partner_tel,
        partner_mkt_sg: segment ? { id: segment.id.toString(), name: segment.name } : { id: "", name: p.partner_segment?.name || "" },
      });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!partner) return <div>Parceiro não encontrado.</div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {partner.partner_desc}
          </h2>
          {/* Badges ao lado do nome */}
          <div className="flex gap-2">
            <Badge 
              variant={partner.is_compadm ? "default" : "secondary"}
              className="px-3 py-1 text-xs font-medium"
            >
              {partner.is_compadm ? "Administrativo" : "Cliente"}
            </Badge>
            <Badge 
              variant={partner.is_active ? "approved" : "destructive"}
              className="px-3 py-1 text-xs font-medium"
            >
              {partner.is_active ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {partner.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="colored2" onClick={handleSave}>Salvar</Button>
              <Button variant="destructive" onClick={handleCancel}>Cancelar</Button>
            </>
          ) : (
            <Button variant="default" onClick={handleEdit}><Pencil className="w-4 h-4 mr-2" />Editar</Button>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-2 col-span-3">
              <Label htmlFor="partner_desc" className="text-sm font-medium text-foreground">Nome</Label>
              {editMode ? (
                <Input 
                  id="partner_desc" 
                  name="partner_desc" 
                  value={form.partner_desc} 
                  onChange={handleChange}
                  className="h-9"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 min-h-[36px] flex items-center">
                  {partner.partner_desc || "-"}
                </div>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="partner_ident" className="text-sm font-medium text-foreground">Identificação</Label>
              {editMode ? (
                <Input 
                  id="partner_ident" 
                  name="partner_ident" 
                  value={form.partner_ident} 
                  onChange={handleChange}
                  className="h-9"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 min-h-[36px] flex items-center font-mono">
                  {partner.partner_ident ? formatCpfCnpj(partner.partner_ident) : "-"}
                </div>
              )}
            </div>
            <div className="space-y-2 col-span-3">
              <Label htmlFor="partner_email" className="text-sm font-medium text-foreground">Email</Label>
              {editMode ? (
                <Input 
                  id="partner_email" 
                  name="partner_email" 
                  type="email"
                  value={form.partner_email} 
                  onChange={handleChange}
                  className="h-9"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 min-h-[36px] flex items-center">
                  {partner.partner_email || "-"}
                </div>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="partner_tel" className="text-sm font-medium text-foreground">Telefone</Label>
              {editMode ? (
                <Input 
                  id="partner_tel" 
                  name="partner_tel" 
                  type="tel"
                  value={form.partner_tel} 
                  onChange={handleChange}
                  className="h-9"
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 min-h-[36px] flex items-center font-mono">
                  {partner.partner_tel ? formatPhoneNumber(partner.partner_tel) : "-"}
                </div>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="partner_mkt_sg" className="text-sm font-medium text-foreground">Segmento</Label>
              {editMode ? (
                <Select
                  value={form.partner_mkt_sg.id}
                  onValueChange={(value) => {
                    const seg = marketSegments.find(s => s.id.toString() === value);
                    setForm(f => ({
                      ...f,
                      partner_mkt_sg: seg ? { id: seg.id.toString(), name: seg.name } : { id: value, name: "" },
                    }));
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id.toString()}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 min-h-[36px] flex items-center">
                  {form.partner_mkt_sg.name || "-"}
                </div>
              )}
            </div>
            {/* Remover badges do grid */}
          </div>
        </CardContent>
      </Card>
      <h1 className="text-md pt-4 pb-1 font-bold">Usuários alocados</h1>
      <CardContent className="p-0">
        {partner.users && partner.users.length > 0 ? (
          <DataTable columns={userColumns} data={partner.users.map(u => ({ id: u.email, ...u }))} />
        ) : (
          <div className="text-gray-500">Nenhum usuário alocado para este parceiro.</div>
        )}
      </CardContent>
    </div>
  );
}
