import React, { useEffect, useState } from "react";
import type { Contract } from "@/types/contracts";
import type { Ticket } from "@/types/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle, TrendingUp, Users, Calendar } from "lucide-react";

interface ProjectDashboardTabProps {
  project: Contract;
}

export default function ProjectDashboardTab({ project }: ProjectDashboardTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/smartbuild/tickets?project_id=${project.id}`)
      .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar tickets'))
      .then(data => setTickets(Array.isArray(data) ? data : data?.data || []))
      .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar tickets'))
      .finally(() => setLoading(false));
  }, [project.id]);

  // Calculate enhanced stats
  const totalHours = tickets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalTickets = tickets.length;
  const closedTickets = tickets.filter(t => t.is_closed).length;
  const openTickets = tickets.filter(t => !t.is_closed).length;
  const progressPercent = totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;
  
  // Tickets by status
  const ticketsByStatus: Record<string, { count: number; color?: string }> = {};
  tickets.forEach(t => {
    const status = t.status?.name || 'Sem status';
    const color = t.status?.color;
    if (!ticketsByStatus[status]) {
      ticketsByStatus[status] = { count: 0, color };
    }
    ticketsByStatus[status].count++;
  });

  // Tickets by category (torre)
  const ticketsByCategory: Record<string, number> = {};
  tickets.forEach(t => {
    const category = t.category?.name || 'Sem categoria';
    ticketsByCategory[category] = (ticketsByCategory[category] || 0) + 1;
  });

  // Tickets by type
  const ticketsByType: Record<string, number> = {};
  tickets.forEach(t => {
    const type = t.type?.name || 'Sem tipo';
    ticketsByType[type] = (ticketsByType[type] || 0) + 1;
  });

  // Tickets by priority
  const ticketsByPriority: Record<string, number> = {};
  tickets.forEach(t => {
    const priority = t.priority?.name || 'Sem prioridade';
    ticketsByPriority[priority] = (ticketsByPriority[priority] || 0) + 1;
  });

  // Recently created tickets (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentTickets = tickets.filter(t => new Date(t.created_at) >= sevenDaysAgo);

  // Average resolution time for closed tickets
  const closedTicketsWithTime = tickets.filter(t => t.is_closed && t.actual_end_date);
  const avgResolutionTime = closedTicketsWithTime.length > 0 
    ? closedTicketsWithTime.reduce((sum, t) => {
        const created = new Date(t.created_at);
        const closed = new Date(t.actual_end_date!);
        return sum + (closed.getTime() - created.getTime());
      }, 0) / closedTicketsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Overdue tickets (planned_end_date < now and not closed)
  const overdueTickets = tickets.filter(t => 
    !t.is_closed && 
    t.planned_end_date && 
    new Date(t.planned_end_date) < now
  );

  // Tickets by assigned resources
  const ticketsByResource: Record<string, number> = {};
  tickets.forEach(t => {
    if (t.resources && t.resources.length > 0) {
      t.resources.forEach(resource => {
        if (resource.user) {
          const userName = `${resource.user.first_name || ''} ${resource.user.last_name || ''}`.trim() || resource.user.email || 'Usuário sem nome';
          ticketsByResource[userName] = (ticketsByResource[userName] || 0) + 1;
        }
      });
    } else {
      ticketsByResource['Não atribuído'] = (ticketsByResource['Não atribuído'] || 0) + 1;
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Dashboard do Projeto</h2>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Carregando dados do dashboard...</p>
        </div>
      )}
      
      {error && (
        <div className="text-destructive text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {closedTickets} fechados, {openTickets} abertos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Média: {totalTickets > 0 ? (totalHours / totalTickets).toFixed(1) : 0}h por ticket
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressPercent}%</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets em Atraso</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueTickets.length}</div>
                <p className="text-xs text-muted-foreground">
                  Prazo vencido
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análises Detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Tickets por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ticketsByStatus).map(([status, data]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: data.color || '#6b7280' }}
                        ></div>
                        <span className="text-sm">{status}</span>
                      </div>
                      <Badge variant="outline">{data.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets por Torre/Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tickets por Torre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ticketsByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tickets por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ticketsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets por Prioridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Tickets por Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(ticketsByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm">{priority}</span>
                      <Badge variant={priority.toLowerCase().includes('alta') ? 'destructive' : 'default'}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets por Responsável */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Distribuição de Tickets por Responsável
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ticketsByResource).map(([resource, count]) => (
                  <div key={resource} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium truncate flex-1 mr-2">{resource}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm">{typeof project.project_status === 'object' ? project.project_status?.name : project.project_status}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                  <p className="text-sm">{project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Data de Fim</p>
                  <p className="text-sm">{project.end_at ? new Date(project.end_at).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Resolução</p>
                  <p className="text-sm">{avgResolutionTime > 0 ? `${avgResolutionTime.toFixed(1)} dias` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente (últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Novos tickets criados</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {recentTickets.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
