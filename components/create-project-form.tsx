"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateProjectForm({ className, onCreate, ...props }: React.ComponentPropsWithoutRef<"div"> & { onCreate?: () => void }) {
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [project_type, setProjectType] = useState("");
  const [project_status, setProjectStatus] = useState("");
  const [is_wildcard, setIsWildcard] = useState<null | boolean>(null);
  const [is_247, setIs247] = useState<null | boolean>(null);
  const [start_date, setStartDate] = useState("");
  const [end_at, setEndAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Buscar parceiros
    fetch("/api/options?type=partners")
      .then((res) => res.json())
      .then((data) => setPartners(data || []));
    // Buscar status de projeto
    fetch("/api/options?type=project_status")
      .then((res) => res.json())
      .then((data) => setStatuses(data || []));
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          projectDesc,
          partnerId,
          project_type,
          project_status,
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
        <CardTitle className="text-2xl">Criar Novo Projeto</CardTitle>
        <CardDescription>Preencha os dados abaixo para criar um novo projeto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateProject}>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="projectDesc">Descrição</Label>
              <Input id="projectDesc" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partnerId">ID do Parceiro</Label>
              <Select value={partnerId} onValueChange={setPartnerId} required>
                <SelectTrigger id="partnerId">
                  <SelectValue placeholder="Selecione o parceiro" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project_type">Tipo de Projeto</Label>
              <Select value={project_type} onValueChange={setProjectType} required>
                <SelectTrigger id="project_type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMS">AMS</SelectItem>
                  <SelectItem value="TKEY">Turn-Key</SelectItem>
                  <SelectItem value="BSHOP">BodyShop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project_status">Status do Projeto</Label>
              <Select value={project_status} onValueChange={setProjectStatus} required>
                <SelectTrigger id="project_status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_wildcard">Wildcard?</Label>
              <Select value={is_wildcard === null ? "all" : is_wildcard ? "true" : "false"} onValueChange={v => setIsWildcard(v === "all" ? null : v === "true") }>
                <SelectTrigger id="is_wildcard"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_247">24/7?</Label>
              <Select value={is_247 === null ? "all" : is_247 ? "true" : "false"} onValueChange={v => setIs247(v === "all" ? null : v === "true") }>
                <SelectTrigger id="is_247"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data Inicial</Label>
              <Input id="start_date" type="date" value={start_date} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_at">Data Final</Label>
              <Input id="end_at" type="date" value={end_at} onChange={e => setEndAt(e.target.value)} />
            </div>
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
