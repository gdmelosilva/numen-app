"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Contract } from "@/types/contracts";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronDown, ChevronUp, Trash } from "lucide-react";

interface Filters {
    projectName: string;
    projectDesc: string;
    partnerId: string;
    project_type: string;
    project_status: string;
    is_wildcard: string;
    is_247: string;
    start_date: string;
    end_at: string;
}

export default function AMSAdminPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [filters, setFilters] = useState<Filters>({
        projectName: "",
        projectDesc: "",
        partnerId: "",
        project_type: "",
        project_status: "",
        is_wildcard: "",
        is_247: "",
        start_date: "",
        end_at: "",
    });
    const [pendingFilters, setPendingFilters] = useState<Filters>(filters);
    const [loading, setLoading] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);

    const buildQueryParams = (customFilters: Filters) => {
        const queryParams = new URLSearchParams();
        if (customFilters.projectName) queryParams.append("projectName", customFilters.projectName);
        if (customFilters.projectDesc) queryParams.append("projectDesc", customFilters.projectDesc);
        if (customFilters.partnerId) queryParams.append("partnerId", customFilters.partnerId);
        if (customFilters.project_type) queryParams.append("project_type", customFilters.project_type);
        if (customFilters.project_status) queryParams.append("project_status", customFilters.project_status);
        if (customFilters.is_wildcard) queryParams.append("is_wildcard", customFilters.is_wildcard);
        if (customFilters.is_247) queryParams.append("is_247", customFilters.is_247);
        if (customFilters.start_date) queryParams.append("start_date", customFilters.start_date);
        if (customFilters.end_at) queryParams.append("end_at", customFilters.end_at);
        return queryParams;
    };

    const fetchContracts = async (customFilters: Filters) => {
        setLoading(true);
        try {
            // AMS projects endpoint
            const queryParams = buildQueryParams(customFilters);
            const response = await fetch(`/api/smartcare/ams-projects?${queryParams.toString()}`);
            if (!response.ok) throw new Error("Erro ao buscar projetos AMS");
            const data = await response.json();
            setContracts(data);
        } catch {
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setPendingFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        setFilters(pendingFilters);
        fetchContracts(pendingFilters);
    };

    const handleClearFilters = () => {
        const cleared: Filters = {
            projectName: "",
            projectDesc: "",
            partnerId: "",
            project_type: "",
            project_status: "",
            is_wildcard: "",
            is_247: "",
            start_date: "",
            end_at: "",
        };
        setPendingFilters(cleared);
        setFilters(cleared);
        fetchContracts(cleared);
    };

    const getActiveFiltersSummary = () => {
        const summary: string[] = [];
        if (pendingFilters.projectName) summary.push(`Título: ${pendingFilters.projectName}`);
        if (pendingFilters.projectDesc) summary.push(`Descrição: ${pendingFilters.projectDesc}`);
        if (pendingFilters.partnerId) summary.push(`Parceiro: ${pendingFilters.partnerId}`);
        if (pendingFilters.project_type) summary.push(`Tipo: ${pendingFilters.project_type}`);
        if (pendingFilters.project_status) summary.push(`Status: ${pendingFilters.project_status}`);
        if (pendingFilters.is_wildcard) summary.push(`Wildcard: ${pendingFilters.is_wildcard}`);
        if (pendingFilters.is_247) summary.push(`24/7: ${pendingFilters.is_247}`);
        if (pendingFilters.start_date) summary.push(`Início: ${pendingFilters.start_date}`);
        if (pendingFilters.end_at) summary.push(`Fim: ${pendingFilters.end_at}`);
        return summary.length ? summary.join(", ") : "Nenhum filtro ativo";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Projetos AMS</h2>
                    <p className="text-sm text-muted-foreground">Administração de Projetos AMS</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="colored2"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        <Search className="mr-2 h-4 w-4" /> Buscar
                    </Button>
                </div>
            </div>
            {filtersCollapsed ? (
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">{getActiveFiltersSummary()}</span>
                        <Button size="sm" variant="ghost" onClick={() => setFiltersCollapsed(false)}>
                            <ChevronDown className="w-4 h-4 mr-2" />Editar filtros
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    <Card>
                        <CardContent className="pt-6 relative">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Título</Label>
                                    <Input
                                        id="projectName"
                                        placeholder="Filtrar por título"
                                        value={pendingFilters.projectName}
                                        onChange={e => handleFilterChange("projectName", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="projectDesc">Descrição</Label>
                                    <Input
                                        id="projectDesc"
                                        placeholder="Filtrar por descrição"
                                        value={pendingFilters.projectDesc}
                                        onChange={e => handleFilterChange("projectDesc", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="partnerId">Parceiro</Label>
                                    <Input
                                        id="partnerId"
                                        placeholder="Filtrar por parceiro (ID)"
                                        value={pendingFilters.partnerId}
                                        onChange={e => handleFilterChange("partnerId", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="project_type">Tipo</Label>
                                    <Input
                                        id="project_type"
                                        placeholder="Filtrar por tipo (ID)"
                                        value={pendingFilters.project_type}
                                        onChange={e => handleFilterChange("project_type", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="project_status">Status</Label>
                                    <Input
                                        id="project_status"
                                        placeholder="Filtrar por status (ID)"
                                        value={pendingFilters.project_status}
                                        onChange={e => handleFilterChange("project_status", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is_wildcard">Wildcard?</Label>
                                    <Input
                                        id="is_wildcard"
                                        placeholder="true/false"
                                        value={pendingFilters.is_wildcard}
                                        onChange={e => handleFilterChange("is_wildcard", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is_247">24/7?</Label>
                                    <Input
                                        id="is_247"
                                        placeholder="true/false"
                                        value={pendingFilters.is_247}
                                        onChange={e => handleFilterChange("is_247", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Início</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={pendingFilters.start_date}
                                        onChange={e => handleFilterChange("start_date", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_at">Fim</Label>
                                    <Input
                                        id="end_at"
                                        type="date"
                                        value={pendingFilters.end_at}
                                        onChange={e => handleFilterChange("end_at", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4 gap-2">
                                <Button
                                    size={"sm"}
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    disabled={loading}
                                    aria-label="Limpar filtros"
                                    className="bg-destructive hover:bg-destructive/90 text-white"
                                >
                                    <Trash className="w-4 h-4 mr-2" />Limpar filtros
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setFiltersCollapsed(true)}
                                    aria-label="Recolher filtros"
                                    className="hover:bg-secondary/90 hover:text-black"
                                >
                                    <ChevronUp className="w-4 h-4 mr-2" />Recolher filtros
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={contracts}
                />
            )}
        </div>
    );
}