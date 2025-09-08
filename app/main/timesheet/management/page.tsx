"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { TimesheetSidebar } from '@/components/TimesheetSidebar'
import { useTicketHoursManagement } from '@/hooks/useTicketHoursManagement'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getColumns, getChildColumns } from './columns'
import { exportTimesheetReport } from '@/lib/export-file'
import { useRouter } from 'next/navigation'

const TimeSheetManagementPage = () => {
	const { data, loading, fetchTicketHours } = useTicketHoursManagement()
	const { user } = useCurrentUser()
	const router = useRouter()

	const today = new Date()
	const [year, setYear] = useState(today.getFullYear())
	const [month, setMonth] = useState(today.getMonth())
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

	// Proteção: Redirecionar usuários clientes
	useEffect(() => {
		if (user && user.is_client) {
			router.push('/denied')
		}
	}, [user, router])

	// Busca automática ao trocar mês/ano
	useEffect(() => {
		fetchTicketHours(year, month, selectedUserId)
	}, [year, month, selectedUserId, fetchTicketHours])

	// Se for cliente, não renderizar nada enquanto redireciona
	if (user?.is_client) {
		return null
	}

	const handleYearChange = (y: number) => setYear(y)
	const handleMonthChange = (m: number) => setMonth(m)
	const handleAccept = () => {/* ação de aceite */}
	const handleFilter = (userId: string | null) => {
		setSelectedUserId(userId)
	}

	const lastUpdate = `${today.toLocaleDateString()} | ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

	const NATIONAL_HOLIDAYS = [
	    '01-01', // Confraternização Universal
	    '04-21', // Tiradentes
	    '05-01', // Dia do Trabalho
	    '09-07', // Independência do Brasil
	    '10-12', // Nossa Senhora Aparecida
	    '11-02', // Finados
	    '11-15', // Proclamação da República
	    '12-25', // Natal
	]

	function isNationalHoliday(date: Date) {
	    const mmdd = date.toISOString().slice(5, 10)
	    return NATIONAL_HOLIDAYS.includes(mmdd)
	}

	function getBusinessDays(year: number, month: number) {
	    let count = 0
	    const daysInMonth = new Date(year, month + 1, 0).getDate()
	    for (let day = 1; day <= daysInMonth; day++) {
	        const date = new Date(year, month, day)
	        const isWeekend = date.getDay() === 0 || date.getDay() === 6
	        if (!isWeekend && !isNationalHoliday(date)) {
	            count++
	        }
	    }
	    return count
	}

	const estimatedHours = getBusinessDays(year, month) * 8 

	// Função para converter data UTC para data local sem conversão de fuso horário
	// const parseUTCDateAsLocal = (utcDateString: string) => {
	// 	const datePart = utcDateString.split('T')[0];
	// 	const [year, month, day] = datePart.split('-').map(Number);
	// 	return new Date(year, month - 1, day);
	// };

	// Função para converter data UTC para horário local brasileiro
	// const parseUTCTimeAsLocal = (utcTimeString: string | undefined) => {
	// 	if (!utcTimeString) return '-';
		
	// 	// Remove o fuso horário da string para tratar como local
	// 	const localTimeString = utcTimeString.replace(/[+-]\d{2}:\d{2}$/, '').replace('Z', '');
	// 	const date = new Date(localTimeString);
		
	// 	// Verifica se a data é válida
	// 	if (isNaN(date.getTime())) return '-';
		
	// 	return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
	// };

	// Converte os dados do hook para o formato esperado pelas colunas e ordena por data
	const tableData = data
		.sort((a, b) => new Date(a.appoint_date).getTime() - new Date(b.appoint_date).getTime())
		.map(row => ({
			id: row.id,
			appoint_date: row.appoint_date,
			total_minutes: row.total_minutes,
			is_approved: row.is_approved,
			user_name: row.user_name,
			user_id: row.user_id,
			project: row.project,
			children: row.children
				?.filter(child => !child.is_deleted) // Filtrar apenas registros não deletados
				?.map(child => ({
					id: child.id,
					appoint_date: child.appoint_date,
					total_minutes: child.total_minutes,
					is_approved: child.is_approved,
					is_deleted: child.is_deleted,
					user_name: child.user_name,
					user_id: child.user_id,
					project: child.project,
					// Campos extras para TicketHour (se necessário)
					minutes: child.minutes, // Usar child.minutes (não total_minutes)
					ticket_id: child.ticket_id,
					project_id: child.project_id,
					ticket_title: child.ticket_title,
					ticket_type_id: child.ticket_type_id,
					ticket_external_id: child.ticket_external_id,
					appoint_start: child.appoint_start,
					appoint_end: child.appoint_end,
					// Adicionar o objeto ticket completo para a função de export
					ticket: child.ticket
				}))
		}))
		.filter(row => row.children && row.children.length > 0); // Remover dias sem registros válidos

	// Calcular dados para o sidebar após filtrar registros deletados
	const launchedDays = tableData.length;
	const workedMinutes = tableData.reduce((acc, row) => {
		const validChildren = row.children?.filter(child => !child.is_deleted) || [];
		const dayMinutes = validChildren.reduce((dayAcc, child) => dayAcc + (child.minutes || 0), 0);
		return acc + dayMinutes;
	}, 0);
	const workedHours = `${String(Math.floor(workedMinutes / 60)).padStart(2, '0')}:${String(workedMinutes % 60).padStart(2, '0')}`;
	const statusHours = workedHours;

	// Função para download do relatório (definida após tableData)
	const handleDownloadReport = () => {
		// Gerar nome do arquivo com data atual
		const now = new Date()
		const dateStr = now.toISOString().split('T')[0]
		const filename = `relatorio-horas-${dateStr}`
		
		// Exportar relatório usando dados filtrados
		exportTimesheetReport(tableData as never, filename, selectedUserId)
	}

	// Obter colunas baseadas no perfil do usuário
	const columns = getColumns();
	const childColumns = getChildColumns(user);

	return (
        <Card className='p-8 h-full'>
            <h1 className="text-2xl font-bold mb-6 text-start">
                Gestão de Apontamentos
            </h1>
            <div className="flex gap-8 w-full max-w-full h-full max-h-full">
                <div>
                    <TimesheetSidebar
                        year={year}
                        month={month}
                        onYearChange={handleYearChange}
                        onMonthChange={handleMonthChange}
                        onAccept={handleAccept}
                        onFilter={handleFilter}
                        onDownloadReport={handleDownloadReport}
                        lastUpdate={lastUpdate}
                        estimatedHours={estimatedHours}
                        launchedDays={launchedDays}
                        workedHours={workedHours}
                        statusHours={statusHours}
                        selectedUserId={selectedUserId}
                        showUserFilter={Boolean(user && !user.is_client && (user.role === 1 || user.role === 2))}
                        isClient={Boolean(user?.is_client)}
                    />
                </div>
                <div className="w-full max-w-full">
                    <DataTable
                        columns={columns as never}
                        data={tableData as never}
                        meta={{ 
                            expanded, 
                            setExpanded,
                            childColumns,
                            showUserInChildren: Boolean(user && !user.is_client && (user.role === 1 || user.role === 2)),
                            user: user ? {
                                id: user.id,
                                role: user.role,
                                is_client: user.is_client
                            } : undefined
                        }}
                    />
                    {loading && <div className="text-center mt-4">Carregando...</div>}
                </div>
            </div>
        </Card>
	)
}

export default TimeSheetManagementPage