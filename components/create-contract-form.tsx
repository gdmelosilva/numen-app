"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export function CreateContractForm({ className, onCreate, ...props }: React.ComponentPropsWithoutRef<"div"> & { onCreate?: () => void }) {
  const [, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [project_type, setProjectType] = useState("");
  const [is_wildcard, setIsWildcard] = useState<null | boolean>(null);
  const [is_247, setIs247] = useState<null | boolean>(null);
  const [start_date, setStartDate] = useState("");
  const [end_at, setEndAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] = useState<{ id: string; name: string; partner_desc?: string; partner_ext_id?: string }[]>([]);

  useEffect(() => {
    // Buscar parceiros (agora trazendo partner_desc e partner_ext_id)
    fetch("/api/options?type=partners")
      .then((res) => res.json())
      .then((data) => setPartners(data || []));
  }, []);

  const checkAMSExists = async (partnerId: string) => {
    const res = await fetch(`/api/admin/contracts?partnerId=${partnerId}&project_type=AMS`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.data) && data.data.length > 0;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Validação frontend: AMS único por parceiro
      if (project_type === "AMS" && partnerId) {
        const exists = await checkAMSExists(partnerId);
        if (exists) {
          setError("Já existe um projeto do tipo AMS para este parceiro.");
          setIsLoading(false);
          return;
        }
      }
      // Definir status fixo conforme o tipo de projeto
      const statusToSend = "5"; //project_type === "AMS" ? "5" : "5";
      const response = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "", // O backend irá gerar o nome correto
          projectDesc,
          partnerId,
          project_type,
          project_status: statusToSend,
          is_wildcard,
          is_247,
          start_date,
          end_at,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar projeto");
      }
      const data = await response.json();
      setProjectName(data.projectName || ""); // Mostra o nome gerado pelo backend
      toast.success("Contrato criado com sucesso!", {
        description: `Nome do contrato: ${data.projectName || "(não informado)"}`,
      });
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
        <CardTitle className="text-2xl">Criar Novo Contrato</CardTitle>
        <CardDescription>Preencha os dados abaixo para criar um novo contrato. O nome do contrato será gerado automaticamente com base no parceiro selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateProject}>
          <div className="mb-6 grid grid-cols-2 gap-4">
            {/* <div className="grid gap-2">
              <Label>Nome do Projeto</Label>
              <Input id="projectName" value={projectName} readOnly className="bg-secondary" />
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="projectDesc">Descrição</Label>
              <Input id="projectDesc" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} required />
            </div>
            <div className="grid gap-2 w-full w-max-full">
              <Label>ID do Parceiro</Label>
              <Select value={partnerId} onValueChange={setPartnerId} required>
                <SelectTrigger id="partnerId" className="w-full w-max-full">
                  <SelectValue placeholder="Selecione o parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-full w-max-full">
              <Label>Tipo de Projeto</Label>
              <Select value={project_type} onValueChange={setProjectType} required>
                <SelectTrigger id="project_type" className="w-full w-max-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMS">AMS</SelectItem>
                  <SelectItem value="TKEY">Turn-Key</SelectItem>
                  <SelectItem value="BSHOP">BodyShop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-full w-max-full">
              <Label className="flex items-center gap-1">
                Wildcard?
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 cursor-pointer text-muted-foreground">
                        <Info size={16} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      O projeto pode ter apontamentos realizados sem alocação prévia?
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={is_wildcard === null ? "all" : is_wildcard ? "true" : "false"} onValueChange={v => setIsWildcard(v === "all" ? null : v === "true") } required>
                <SelectTrigger className="w-full w-max-full" id="is_wildcard"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-full w-max-full">
              <Label>24/7?</Label>
              <Select value={is_247 === null ? "all" : is_247 ? "true" : "false"} onValueChange={v => setIs247(v === "all" ? null : v === "true") } required>
                <SelectTrigger id="is_247" className="w-full w-max-full"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data Inicial</Label>
              <Input id="start_date" type="date" value={start_date} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_at">Data Final</Label>
              <Input id="end_at" type="date" value={end_at} onChange={e => setEndAt(e.target.value)} />
            </div>
            {/* Campos de cobrança só aparecem se NÃO for AMS */}
            {project_type !== "AMS" && (
              <>
                {/* Adicione aqui os campos de cobrança, se existirem */}
                {/* Exemplo:
                <div className="grid gap-2">
                  <Label htmlFor="hours_max">Horas Máx.</Label>
                  <Input id="hours_max" type="number" value={hours_max} onChange={e => setHoursMax(e.target.value)} />
                </div>
                */}
              </>
            )}
          </div>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Projeto"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
