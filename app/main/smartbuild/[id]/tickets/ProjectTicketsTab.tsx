import React, { useEffect, useState } from 'react';
import { getTicketColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { Ticket } from '@/types/tickets';
import type { Contract } from '@/types/contracts';
import CreateActivityDialog from './CreateActivityDialog';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
import { getCategoryOptions, getPriorityOptions, getModuleOptions } from '@/hooks/useOptions';

interface ProjectTicketsTabProps {
    projectId: string;
    partnerId: string;
    project?: Contract;
}

// Componente para exibir a tabela/lista de tickets do projeto
export default function ProjectTicketsTab({ projectId, partnerId, project }: ProjectTicketsTabProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);    // Estados para selects
    const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([]);
    const [modules, setModules] = useState<{ id: string; name: string; description: string }[]>([]);
    const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);

    // Determina se o projeto é AMS baseado no project_type
    const isAms = project?.project_type === 'AMS';

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/smartbuild/tickets?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar tickets'))
            .then(data => setTickets(Array.isArray(data) ? data : data?.data ?? []))
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar tickets'))
            .finally(() => setLoading(false));
    }, [projectId]);    useEffect(() => {
        // Filtrar categorias conforme o tipo do projeto:
        // Se AMS (project_type === 'AMS'), mostrar categorias com is_ams = true
        // Se não AMS, mostrar categorias com is_ams = false
        console.log('ProjectTicketsTab - project?.project_type:', project?.project_type);
        console.log('ProjectTicketsTab - isAms:', isAms);
        console.log('ProjectTicketsTab - Buscando categorias com is_ams =', isAms);
        getCategoryOptions(isAms).then((data) => {
            console.log('ProjectTicketsTab - Categorias encontradas:', data?.length, data);
            setCategories(data ?? []);
        });
        getPriorityOptions().then((data) => setPriorities(data ?? []));
        getModuleOptions().then((data) => setModules(data ?? []));
    }, [isAms, project?.project_type]);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h2 className="flex items-center text-lg font-semibold">
                    <File className="mr-2 w-4 h-4" /> Atividades Associadas
                </h2>
                <Button onClick={() => setOpenDialog(true)} className="whitespace-nowrap mt-2 md:mt-0" variant="colored2">
                    Abrir Atividade
                </Button>
            </div>            <CreateActivityDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                projectId={projectId}
                partnerId={partnerId}
                categories={categories}
                modules={modules}
                priorities={priorities}
                isAms={isAms}
                onCreated={() => {
                    setLoading(true);
                    fetch(`/api/smartbuild/tickets?project_id=${projectId}`)
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
