"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketingInterface } from "@/types/marketing_segments";
import { getMarketSegments } from "@/hooks/useOptions";
import { formatCpfCnpj, formatPhoneNumber, formatCEP } from "@/lib/utils";

export function CreatePartnerForm({
  className,
  onCreate,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { onCreate?: () => void }) {
  const [partner_desc, setPartnerDesc] = useState("");
  const [partner_ident, setPartnerIdent] = useState("");
  const [partner_email, setPartnerEmail] = useState("");
  const [partner_tel, setPartnerTel] = useState("");
  const [partner_mkt_sg, setPartnerMktSg] = useState<{ id: string; name: string }>({ id: "", name: "" });
  const [is_compadm, setIsCompadm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partner_cep, setPartnerCep] = useState("");
  const [partner_addrs, setPartnerAddrs] = useState("");
  const [partner_compl, setPartnerCompl] = useState("");
  const [partner_distr, setPartnerDistr] = useState("");
  const [partner_city, setPartnerCity] = useState("");
  const [partner_state, setPartnerState] = useState("");
  const [partner_cntry, setPartnerCntry] = useState("");
  const [marketSegments, setMarketSegments] = useState<MarketingInterface[]>([]);

  useEffect(() => {
    getMarketSegments().then((segments) => {
      if (segments) setMarketSegments(segments);
    });
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_desc,
          partner_ident,
          partner_email,
          partner_tel,
          partner_mkt_sg: partner_mkt_sg.id ? Number(partner_mkt_sg.id) : null,
          is_compadm,
          partner_cep,
          partner_addrs,
          partner_compl,
          partner_distr,
          partner_city,
          partner_state,
          partner_cntry,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar parceiro");
      }

      if (onCreate) onCreate();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Erro desconhecido");
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-2xl">Criar Novo Parceiro</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para criar um novo parceiro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreatePartner}>
          <div className="grid grid-cols-4 gap-8 mb-6">
            {/* Seção 1: Dados principais (colunas 1 e 2) */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {/* Linha 1: Nome */}
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="partner_desc">Nome</Label>
                <Input id="partner_desc" value={partner_desc} onChange={(e) => setPartnerDesc(e.target.value)} required />
              </div>
              {/* Linha 2: Identificador e Telefone */}
              <div className="grid gap-2">
                <Label htmlFor="partner_ident">Identificador</Label>
                <Input
                  id="partner_ident"
                  value={formatCpfCnpj(partner_ident)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw.length <= 14) setPartnerIdent(raw);
                  }}
                  maxLength={18} // 18 chars for formatted CNPJ
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_tel">Telefone</Label>
                <Input
                  id="partner_tel"
                  value={formatPhoneNumber(partner_tel)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw.length <= 11) setPartnerTel(raw);
                  }}
                  maxLength={15} // (99) 99999-9999
                  required
                />
              </div>
              {/* Linha 3: Email */}
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="partner_email">Email</Label>
                <Input id="partner_email" type="email" value={partner_email} onChange={(e) => setPartnerEmail(e.target.value)} required />
              </div>
              {/* Linha 4: Segmento e Tipo */}
              <div className="grid gap-2">
                <Label htmlFor="partner_mkt_sg" className="text-sm font-medium text-foreground">Segmento</Label>
                <Select value={partner_mkt_sg.id} onValueChange={(value) => {
                  const seg = marketSegments.find(s => s.id.toString() === value);
                  setPartnerMktSg(seg ? { id: seg.id.toString(), name: seg.name } : { id: value, name: "" });
                }}>
                  <SelectTrigger className="space-y-2 w-full w-max-full">
                    <SelectValue placeholder="Segmento" />
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
              <div className="grid gap-2">
                <Label htmlFor="is_compadm">Tipo Parceiro</Label>
                <Select value={is_compadm ? "true" : "false"} onValueChange={(value) => setIsCompadm(value === "true")}>
                  <SelectTrigger id="is_compadm" className="space-y-2 w-full w-max-full">
                    {is_compadm ? "Administrativo" : "Cliente"}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Cliente</SelectItem>
                    <SelectItem value="true">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Seção 2: Endereço (colunas 3 e 4) */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="partner_cep">CEP</Label>
                <Input
                  id="partner_cep"
                  value={formatCEP(partner_cep)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw.length <= 8) setPartnerCep(raw);
                  }}
                  maxLength={9} // 99999-999
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_cntry">País</Label>
                <Input id="partner_cntry" value={partner_cntry} onChange={(e) => setPartnerCntry(e.target.value)} />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="partner_addrs">Endereço</Label>
                <Input id="partner_addrs" value={partner_addrs} onChange={(e) => setPartnerAddrs(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_compl">Complemento</Label>
                <Input id="partner_compl" value={partner_compl} onChange={(e) => setPartnerCompl(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_distr">Bairro</Label>
                <Input id="partner_distr" value={partner_distr} onChange={(e) => setPartnerDistr(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_city">Cidade</Label>
                <Input id="partner_city" value={partner_city} onChange={(e) => setPartnerCity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_state">Estado</Label>
                <Input id="partner_state" value={partner_state} onChange={(e) => setPartnerState(e.target.value)} />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Parceiro"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}