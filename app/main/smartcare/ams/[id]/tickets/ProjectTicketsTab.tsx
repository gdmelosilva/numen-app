import React, { useEffect, useState } from 'react';
import { getTicketColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { Ticket } from '@/types/tickets';
import CreateTicketDialog from './CreateTicketDialog';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';

interface ProjectTicketsTabProps {
    projectId: string;
}

// Componente para exibir a tabela/lista de tickets do projeto
export default function ProjectTicketsTab({ projectId }: ProjectTicketsTabProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    // Estados para selects
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
    const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/smartcare/tickets?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar tickets'))
            .then(data => setTickets(Array.isArray(data) ? data : data?.data ?? []))
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar tickets'))
            .finally(() => setLoading(false));
    }, [projectId]);

    useEffect(() => {
        fetch('/api/options?type=ticket_categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []));
        fetch('/api/options?type=ticket_modules').then(r => r.json()).then(d => setModules(Array.isArray(d) ? d : []));
        fetch('/api/options?type=ticket_priorities').then(r => r.json()).then(d => setPriorities(Array.isArray(d) ? d : []));
    }, []);

    // Busca o partnerId do primeiro ticket, se houver, ou defina conforme a lógica do seu projeto
    const partnerId = tickets.length > 0 ? tickets[0].partner_id : undefined;

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h2 className="flex items-center text-lg font-semibold">
                    <File className="mr-2 w-4 h-4" /> Chamados Associados
                </h2>
                <Button onClick={() => setOpenDialog(true)} className="whitespace-nowrap mt-2 md:mt-0" variant="colored2">
                    Abrir Chamado
                </Button>
            </div>
            <CreateTicketDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                projectId={projectId}
                partnerId={partnerId || ''}
                categories={categories}
                modules={modules}
                priorities={priorities}
                onCreated={() => {
                    setLoading(true);
                    fetch(`/api/smartcare/tickets?project_id=${projectId}`)
                        .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar tickets'))
                        .then(data => setTickets(Array.isArray(data) ? data : data?.data ?? []))
                        .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar tickets'))
                        .finally(() => setLoading(false));
                }}
            />
            {loading ? (
                <div className="text-center py-8">Carregando tickets...</div>
            ) : error ? (
                <div className="text-destructive text-center py-8">{error}</div>
            ) : !tickets.length ? (
                <div className="text-muted-foreground text-center py-8">Nenhum ticket encontrado para este projeto.</div>
            ) : (
                <DataTable columns={getTicketColumns({ priorities, types: categories, statuses: [] })} data={tickets} />
            )}
        </>
    );
}
