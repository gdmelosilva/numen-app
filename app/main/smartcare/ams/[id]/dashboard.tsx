import React, { useEffect, useState, useCallback } from "react";
import type { Contract } from "@/types/contracts";
import type { Ticket } from "@/types/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle, TrendingUp, Users, Calendar } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProjectDashboardTabProps {
  project: Contract;
}

interface TicketHour {
  id: string;
  minutes: number;
  billable_minutes?: number;
  is_approved: boolean;
  user_id?: string;
  ticket_id: string;
  project_id: string;
  appoint_date: string;
}

export default function ProjectDashboardTab({ project }: ProjectDashboardTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketHours, setTicketHours] = useState<TicketHour[]>([]);
  const [estimatedTotalHours, setEstimatedTotalHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useCurrentUser();

  // Função para buscar horas estimadas totais dos tickets do projeto (otimizada)
  const fetchEstimatedHours = useCallback(async (): Promise<number> => {
    if (!currentUser?.is_client || !project.id) return 0;
    
    try {
      const url = `/api/tickets/estimated-hours?project_id=${project.id}&client_view=true`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Erro ao buscar horas estimadas:', response.statusText);
        return 0;
      }
      
      const data = await response.json();
      return data.totalHours || 0;
    } catch (error) {
      console.error('Erro ao buscar horas estimadas:', error);
      return 0;
    }
  }, [currentUser?.is_client, project.id]);

  // Função para buscar horas do projeto considerando visibilidade do cliente  
  const fetchProjectHours = useCallback(async (): Promise<TicketHour[]> => {
    if (!currentUser || !project.id) return [];
    
    try {
      let url = `/api/ticket-hours?project_id=${project.id}`;
      
      // Aplicar filtros baseados no perfil do usuário
      if (currentUser.is_client) {
        // Cliente: apenas horas aprovadas
        url += `&client_view=true&approved_only=true`;
        if (currentUser.partner_id) {
          url += `&partner_id=${currentUser.partner_id}`;
        }
      } else if (currentUser.role === 3) {
        // Funcional: apenas suas próprias horas
        url += `&user_id=${currentUser.id}`;
      } else if (currentUser.role === 2) {
        // Manager: horas dos projetos que gerencia
        url += `&manager_view=true&manager_id=${currentUser.id}`;
      } else if (currentUser.role === 1) {
        // Admin: todas as horas
        url += `&admin_view=true`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar horas');
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao buscar horas:', error);
      return [];
    }
  }, [currentUser, project.id]);

  useEffect(() => {
    const loadData = async () => {
      if (!project.id || !currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Buscar tickets e horas em paralelo
        console.log('Iniciando busca de dados para projeto:', project.id);
        
        const ticketsPromise = fetch(`/api/smartcare/tickets?project_id=${project.id}`)
          .then(res => {
            console.log('Response status tickets:', res.status, res.statusText);
            if (!res.ok) {
              return res.text().then(text => {
                console.error('Erro na API de tickets:', text);
                throw new Error(`Erro ao buscar tickets: ${res.status} - ${text}`);
              });
            }
            return res.json();
          });
        
        const [ticketsResponse, hoursData] = await Promise.all([
          ticketsPromise,
          fetchProjectHours()
        ]);
        
        console.log('Dashboard - Dados carregados:', {
          ticketsResponse,
          ticketsCount: Array.isArray(ticketsResponse) ? ticketsResponse.length : ticketsResponse?.data?.length || 0,
          hoursData,
          hoursCount: hoursData.length,
          projectId: project.id
        });
        
        const ticketList = Array.isArray(ticketsResponse) ? ticketsResponse : ticketsResponse?.data || [];
        setTickets(ticketList);
        setTicketHours(hoursData);
        
        // Para clientes, buscar horas estimadas totais do projeto
        if (currentUser?.is_client && ticketList.length > 0) {
          const estimatedTotal = await fetchEstimatedHours();
          setEstimatedTotalHours(estimatedTotal);
        }
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Erro ao buscar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [project.id, currentUser, fetchProjectHours, fetchEstimatedHours]);

  // Calculate enhanced stats
  // Para clientes, usar horas estimadas totais, para outros usar minutes normais das horas apontadas
  const totalHours = currentUser?.is_client 
    ? estimatedTotalHours // Usar horas estimadas totais para clientes
    : ticketHours.reduce((sum, hour) => sum + ((hour.minutes || 0) / 60), 0); // Usar horas apontadas para usuários internos
  
  // Se não há dados de horas (ticketHours) para usuários internos, usar os dados dos tickets como fallback
  const fallbackTotalHours = tickets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const displayTotalHours = currentUser?.is_client 
    ? totalHours // Para clientes, sempre usar horas estimadas
    : (ticketHours.length > 0 ? totalHours : fallbackTotalHours); // Para usuários internos, usar horas apontadas ou fallback
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

  // Preparar dados para gráfico de status
  const statusChartData = Object.entries(ticketsByStatus).map(([status, data]) => ({
    name: status,
    value: data.count,
    color: data.color || '#6b7280',
    percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0
  }));

  // Tickets by category (torre)
  const ticketsByCategory: Record<string, number> = {};
  tickets.forEach(t => {
    const category = t.category?.name || 'Sem categoria';
    ticketsByCategory[category] = (ticketsByCategory[category] || 0) + 1;
  });

  // Preparar dados para gráfico de categoria (torre)
  const categoryChartData = Object.entries(ticketsByCategory).map(([category, count]) => ({
    name: category,
    value: count,
    percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
  }));

  // Cores pré-definidas para categorias
  const categoryColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87ceeb', '#ffb347'];

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
        {/* Debug Info */}
        <div className="ml-auto text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          Tickets: {tickets.length} | Horas: {ticketHours.length}
        </div>
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

      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
          <p className="text-muted-foreground">
            Este projeto ainda não possui tickets registrados.
          </p>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
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
                <CardTitle className="text-sm font-medium">
                  {currentUser?.is_client ? 'Horas Estimadas' : 'Horas Totais'}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayTotalHours.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.is_client 
                    ? `Estimativa total: ${totalTickets > 0 ? (displayTotalHours / totalTickets).toFixed(1) : 0}h por ticket`
                    : `Média: ${totalTickets > 0 ? (displayTotalHours / totalTickets).toFixed(1) : 0}h por ticket`
                  }
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
            {/* Tickets por Status - Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Tickets por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        tick={{ fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number, name: string) => [
                          `${value} tickets (${statusChartData.find(d => d.name === name)?.percentage || 0}%)`,
                          'Quantidade'
                        ]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legenda com badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {item.name}: {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets por Torre/Categoria - Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tickets por Torre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        tick={{ fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [
                          `${value} tickets (${categoryChartData.find(d => d.value === value)?.percentage || 0}%)`,
                          'Quantidade'
                        ]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legenda com badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {item.name}: {item.value} ({item.percentage}%)
                      </span>
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
