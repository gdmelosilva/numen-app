"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { TimesheetSidebar } from '@/components/TimesheetSidebar'
import { useTicketHoursManagement } from '@/hooks/useTicketHoursManagement'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getColumns } from './columns'

const TimeSheetManagementPage = () => {
	const { data, loading, fetchTicketHours } = useTicketHoursManagement()
	const { user } = useCurrentUser()

	const today = new Date()
	const [year, setYear] = useState(today.getFullYear())
	const [month, setMonth] = useState(today.getMonth())
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})

	// Busca automática ao trocar mês/ano
	useEffect(() => {
		fetchTicketHours(year, month)
	}, [year, month, fetchTicketHours])

	const handleYearChange = (y: number) => setYear(y)
	const handleMonthChange = (m: number) => setMonth(m)
	const handleAccept = () => {/* ação de aceite */}
	const handleFilter = () => {/* ação de filtro */}
	const handleReprocess = () => {/* ação de reprocessamento */}

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
	const launchedDays = data.length
	const workedMinutes = data.reduce((acc, row) => acc + (row.total_minutes || 0), 0)
	const workedHours = `${String(Math.floor(workedMinutes / 60)).padStart(2, '0')}:${String(workedMinutes % 60).padStart(2, '0')}`
	const statusHours = workedHours 

	// Função para converter data UTC para data local sem conversão de fuso horário
	const parseUTCDateAsLocal = (utcDateString: string) => {
		const datePart = utcDateString.split('T')[0];
		const [year, month, day] = datePart.split('-').map(Number);
		return new Date(year, month - 1, day);
	};

	// Converte os dados do hook para o formato esperado pelas colunas e ordena por data
	const tableData = data
		.sort((a, b) => parseUTCDateAsLocal(a.appoint_date).getTime() - parseUTCDateAsLocal(b.appoint_date).getTime())
		.map(row => ({
			id: row.id,
			appoint_date: row.appoint_date,
			total_minutes: row.total_minutes,
			is_approved: row.is_approved,
			user_name: row.user_name,
			user_id: row.user_id,
			project: row.project,
			children: row.children?.map(child => ({
				id: child.id,
				appoint_date: child.appoint_date,
				total_minutes: child.total_minutes,
				is_approved: child.is_approved,
				user_name: child.user_name,
				user_id: child.user_id,
				project: child.project,
				// Campos extras para TicketHour (se necessário)
				minutes: child.total_minutes,
				ticket_id: child.id,
				appoint_start: child.appoint_start ? new Date(child.appoint_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
				appoint_end: child.appoint_end ? new Date(child.appoint_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'
			}))
		}));

	// Obter colunas baseadas no perfil do usuário
	const columns = getColumns(user);

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
                        onReprocess={handleReprocess}
                        lastUpdate={lastUpdate}
                        estimatedHours={estimatedHours}
                        launchedDays={launchedDays}
                        workedHours={workedHours}
                        statusHours={statusHours}
                    />
                </div>
                <div className="w-full max-w-full">
                    <DataTable
                        columns={columns as never}
                        data={tableData as never}
                        meta={{ 
                            expanded, 
                            setExpanded,
                            showUserInChildren: Boolean(user && !user.is_client && (user.role === 1 || user.role === 2))
                        }}
                    />
                    {loading && <div className="text-center mt-4">Carregando...</div>}
                </div>
            </div>
        </Card>
	)
}

export default TimeSheetManagementPage