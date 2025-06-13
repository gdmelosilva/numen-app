import React, { useEffect, useState } from "react";

interface Ticket {
  id: string;
  hours?: number;
  is_closed?: boolean;
  status?: { name?: string };
}

interface AMSProject {
  id: string;
  projectName: string;
  projectDesc?: string;
  partnerId?: string;
  start_date?: string;
  end_at?: string;
  project_type?: string;
  project_status?: string | { name?: string };
  // ...outros campos relevantes
}

interface AMSProjectDashboardTabProps {
  project: AMSProject;
}

export default function AMSProjectDashboardTab({ project }: AMSProjectDashboardTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/smartcare/tickets?project_id=${project.id}`)
      .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar tickets'))
      .then(data => setTickets(Array.isArray(data) ? data : data?.data || []))
      .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar tickets'))
      .finally(() => setLoading(false));
  }, [project.id]);

  // Calculate stats
  const totalHours = tickets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalTickets = tickets.length;
  const closedTickets = tickets.filter(t => t.is_closed).length;
  const openTickets = tickets.filter(t => !t.is_closed).length;
  const progressPercent = totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;
  const ticketsByStatus: Record<string, number> = {};
  tickets.forEach(t => {
    const status = t.status?.name || 'Sem status';
    ticketsByStatus[status] = (ticketsByStatus[status] || 0) + 1;
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard do Projeto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Horas do projeto */}
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Horas Totais (tickets)</span>
          <span className="text-2xl font-semibold mt-2">{totalHours}</span>
        </div>
        {/* Datas */}
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Início</span>
          <span className="text-lg mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</span>
          <span className="text-sm text-muted-foreground mt-2">Fim</span>
          <span className="text-lg mt-1">{project.end_at ? new Date(project.end_at).toLocaleDateString() : '-'}</span>
        </div>
        {/* Progresso */}
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center w-full">
          <span className="text-sm text-muted-foreground text-center w-full">Progresso</span>
          <div className="w-full flex flex-col items-center mt-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-full max-w-xs">
              <div
                className="h-3 bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="block text-center text-xs mt-1">{progressPercent}%</span>
          </div>
        </div>
        {/* Status do projeto */}
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="text-lg mt-2">{typeof project.project_status === 'object' ? project.project_status?.name : project.project_status}</span>
        </div>
      </div>
      {/* Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Tickets Abertos</span>
          <span className="text-2xl font-semibold mt-2">{openTickets}</span>
        </div>
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Tickets Fechados</span>
          <span className="text-2xl font-semibold mt-2">{closedTickets}</span>
        </div>
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Total de Tickets</span>
          <span className="text-2xl font-semibold mt-2">{totalTickets}</span>
        </div>
        <div className="bg-white dark:bg-muted rounded-lg shadow p-4 flex flex-col items-center w-full">
          <span className="text-sm text-muted-foreground">Tickets por Status</span>
          <div className="w-full mt-2">
            {Object.keys(ticketsByStatus).length > 0 ? (
              <ul className="text-xs">
                {Object.entries(ticketsByStatus).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{status}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>
      {loading && <div className="text-center py-8">Carregando dados do dashboard...</div>}
      {error && <div className="text-destructive text-center py-8">{error}</div>}
    </div>
  );
}
