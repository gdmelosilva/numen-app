import React, { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { Ticket } from '@/types/tickets';

interface ProjectTicketsTabProps {
    readonly projectId: string;
}

// Componente para exibir a tabela/lista de tickets do projeto
export default function ProjectTicketsTab({ projectId }: ProjectTicketsTabProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);    useEffect(() => {
        console.log("ProjectTicketsTab received projectId:", projectId);
        setLoading(true);
        setError(null);        fetch(`/api/smartbuild/tickets?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Erro ao buscar tickets')))
            .then(data => setTickets(Array.isArray(data) ? data : data?.data ?? []))
            .catch(err => setError(err instanceof Error ? err.message : 'Erro ao buscar tickets'))
            .finally(() => setLoading(false));
    }, [projectId]);

    if (loading) return <div className="text-center py-8">Carregando tickets...</div>;
    if (error) return <div className="text-destructive text-center py-8">{error}</div>;
    if (!tickets.length) return <div className="text-muted-foreground text-center py-8">Nenhum ticket encontrado para este projeto.</div>;

    return (
        <DataTable columns={columns} data={tickets} />
    );
}
