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
import { UnlinkUserButton } from "@/components/UnlinkUserButton";
import { LinkUserButton } from "@/components/LinkUserButton";
import { ColoredBadge } from "@/components/ui/colored-badge";

type PageProps = {
  params?: Promise<{ id: string }>;
};

async function getPartner(id: string): Promise<PartnerWithUsers | null> {
  // Use sempre a mesma baseURL para evitar duplicidade de requests
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const res = await fetch(`${baseUrl}/api/admin/partners/${id}`);
  if (!res.ok) return null;
  const partner = await res.json();
  if (!partner) return null;
  // Fetch users for this partner (filtering already in the query)
  const usersRes = await fetch(`${baseUrl}/api/admin/users?partner_id=${id}`);
  const users = usersRes.ok ? await usersRes.json() : [];
  partner.users = users;
  return partner;
}

interface PartnerWithUsers extends Partner {
  users: Array<{
    id: string;
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

export default function PartnerDetailsPage(props: Readonly<PageProps>) {
  const [partnerId, setPartnerId] = useState<string>("");
  const [partner, setPartner] = useState<PartnerWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    partner_desc: "",
    partner_ident: "",
    partner_email: "",
    partner_tel: "",
    partner_mkt_sg: { id: "", name: "" },
    partner_cep: "",
    partner_addrs: "",
    partner_compl: "",
    partner_distr: "",
    partner_city: "",
    partner_state: "",
    partner_cntry: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [marketSegments, setMarketSegments] = useState<MarketingInterface[]>([]);

  // Extrai partnerId de props.params
  useEffect(() => {
    if (!props.params) return;
    props.params.then((p) => setPartnerId(p?.id ?? ""));
  }, [props.params]);

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
              : { id: "", name: p.partner_segment?.name ?? "" },
            partner_cep: p.partner_cep ?? "",
            partner_addrs: p.partner_addrs ?? "",
            partner_compl: p.partner_compl ?? "",
            partner_distr: p.partner_distr ?? "",
            partner_city: p.partner_city ?? "",
            partner_state: p.partner_state ?? "",
            partner_cntry: p.partner_cntry ?? "",
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
        partner_mkt_sg: segment ? { id: segment.id.toString(), name: segment.name } : { id: "", name: partner.partner_segment?.name ?? "" },
        partner_cep: partner.partner_cep ?? "",
        partner_addrs: partner.partner_addrs ?? "",
        partner_compl: partner.partner_compl ?? "",
        partner_distr: partner.partner_distr ?? "",
        partner_city: partner.partner_city ?? "",
        partner_state: partner.partner_state ?? "",
        partner_cntry: partner.partner_cntry ?? "",
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
          partner_cep: form.partner_cep,
          partner_addrs: form.partner_addrs,
          partner_compl: form.partner_compl,
          partner_distr: form.partner_distr,
          partner_city: form.partner_city,
          partner_state: form.partner_state,
          partner_cntry: form.partner_cntry,
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
        partner_mkt_sg: segment ? { id: segment.id.toString(), name: segment.name } : { id: "", name: p.partner_segment?.name ?? "" },
        partner_cep: p.partner_cep ?? "",
        partner_addrs: p.partner_addrs ?? "",
        partner_compl: p.partner_compl ?? "",
        partner_distr: p.partner_distr ?? "",
        partner_city: p.partner_city ?? "",
        partner_state: p.partner_state ?? "",
        partner_cntry: p.partner_cntry ?? "",
      });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
      cell: ({ row }) => {
        let roleLabel = "";
        if (row.original.role === 1) {
          roleLabel = "Administrador";
        } else if (row.original.role === 2) {
          roleLabel = "Gerente";
        } else if (row.original.is_client) {
          roleLabel = "Key-User";
        } else {
          roleLabel = "Funcional";
        }
        return <ColoredBadge value={roleLabel} type="user_role" />;
      },
    },
    {
      accessorKey: "is_client",
      header: "Tipo",
      cell: ({ row }) => (
        <ColoredBadge value={row.original.is_client} type="is_client" />
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <ColoredBadge value={row.original.is_active} type="status" />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        partner ? (
          <UnlinkUserButton
            user={row.original}
            partnerId={partner.id}
            onUnlinked={async () => {
              setLoading(true);
              setError(null);
              const p = await getPartner(partnerId);
              setPartner(p);
              setLoading(false);
            }}
          />
        ) : null
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

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
      {/* Card-styled partner details */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Nome */}
            <div>
              <Label htmlFor="partner_desc" className="text-xs text-muted-foreground">Nome</Label>
              <Input id="partner_desc" name="partner_desc" value={form.partner_desc} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Identificação */}
            <div>
              <Label htmlFor="partner_ident" className="text-xs text-muted-foreground">Identificação</Label>
              <Input
                id="partner_ident"
                name="partner_ident"
                value={formatCpfCnpj(form.partner_ident)}
                onChange={e => {
                  // Mantém apenas números no estado
                  const raw = e.target.value.replace(/\D/g, "");
                  setForm(prev => ({ ...prev, partner_ident: raw }));
                }}
                className="h-9 font-mono"
                disabled={!editMode}
                inputMode="numeric"
                maxLength={18}
              />
            </div>
            {/* Email */}
            <div>
              <Label htmlFor="partner_email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="partner_email" name="partner_email" value={form.partner_email} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            {/* Telefone */}
            <div>
              <Label htmlFor="partner_tel" className="text-xs text-muted-foreground">Telefone</Label>
              <Input
                id="partner_tel"
                name="partner_tel"
                value={formatPhoneNumber(form.partner_tel)}
                onChange={e => {
                  // Mantém apenas números no estado
                  const raw = e.target.value.replace(/\D/g, "");
                  setForm(prev => ({ ...prev, partner_tel: raw }));
                }}
                className="h-9 font-mono"
                disabled={!editMode}
                inputMode="numeric"
                maxLength={15}
              />
            </div>
            {/* Segmento */}
            <div>
              <Label htmlFor="partner_mkt_sg" className="text-xs text-muted-foreground">Segmento de Mercado</Label>
              <Select
                name="partner_mkt_sg"
                value={form.partner_mkt_sg.id}
                onValueChange={(value) => {
                  const segment = marketSegments.find(s => s.id.toString() === value);
                  setForm((prev) => ({ ...prev, partner_mkt_sg: segment ? { id: segment.id.toString(), name: segment.name } : { id: "", name: "" } }));
                }}
                disabled={!editMode}
              >
                <SelectTrigger className="h-9 w-full w-max-full">
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
            </div>
            {/* Ativo */}
            <div>
              <Label className="text-xs text-muted-foreground">Ativo</Label>
              <Input value={partner.is_active ? 'Sim' : 'Não'} disabled className="h-9" />
            </div>
            {/* Administrativo */}
            <div>
              <Label className="text-xs text-muted-foreground">Administrativo</Label>
              <Input value={partner.is_compadm ? 'Sim' : 'Não'} disabled className="h-9" />
            </div>
            {/* Endereço */}
            <div>
              <Label htmlFor="partner_addrs" className="text-xs text-muted-foreground">Endereço</Label>
              <Input id="partner_addrs" name="partner_addrs" value={form.partner_addrs} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            <div>
              <Label htmlFor="partner_compl" className="text-xs text-muted-foreground">Complemento</Label>
              <Input id="partner_compl" name="partner_compl" value={form.partner_compl} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            <div>
              <Label htmlFor="partner_distr" className="text-xs text-muted-foreground">Bairro</Label>
              <Input id="partner_distr" name="partner_distr" value={form.partner_distr} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            <div>
              <Label htmlFor="partner_city" className="text-xs text-muted-foreground">Cidade</Label>
              <Input id="partner_city" name="partner_city" value={form.partner_city} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            <div>
              <Label htmlFor="partner_state" className="text-xs text-muted-foreground">Estado</Label>
              <Input id="partner_state" name="partner_state" value={form.partner_state} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
            <div>
              <Label htmlFor="partner_cep" className="text-xs text-muted-foreground">CEP</Label>
              <Input
                id="partner_cep"
                name="partner_cep"
                value={form.partner_cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                onChange={e => {
                  // Mantém apenas números no estado
                  const raw = e.target.value.replace(/\D/g, "");
                  setForm(prev => ({ ...prev, partner_cep: raw }));
                }}
                className="h-9"
                disabled={!editMode}
                inputMode="numeric"
                maxLength={9}
              />
            </div>
            <div>
              <Label htmlFor="partner_cntry" className="text-xs text-muted-foreground">País</Label>
              <Input id="partner_cntry" name="partner_cntry" value={form.partner_cntry} onChange={handleChange} className="h-9" disabled={!editMode} />
            </div>
          </form>
        </CardContent>
      </Card>
      <h1 className="text-md pt-4 pb-1 font-bold flex items-center justify-between">
        Usuários Vinculados
        <div>
          {/* Adicionar usuário button à direita */}
          {partner && (
            <LinkUserButton
              partnerId={partner.id}
              onLinked={async () => {
                setLoading(true);
                setError(null);
                const p = await getPartner(partnerId);
                setPartner(p);
                setLoading(false);
              }}
            />
          )}
        </div>
      </h1>
      <CardContent className="p-0">
        {partner.users && partner.users.length > 0 ? (
          <DataTable columns={userColumns} data={partner.users} />
        ) : (
          <div className="text-gray-500">Nenhum usuário alocado para este parceiro.</div>
        )}
      </CardContent>
    </div>
  );
}