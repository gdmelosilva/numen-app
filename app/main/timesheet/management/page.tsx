"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { TimesheetSidebar } from '@/components/TimesheetSidebar'
import { useTicketHoursManagement } from '@/hooks/useTicketHoursManagement'
import { columns } from './columns'

const TimeSheetManagementPage = () => {
	const { data, loading, fetchTicketHours } = useTicketHoursManagement()

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
	// Filtra os dados conforme o mês e ano selecionados
	const filteredData = data.filter(row => {
	    if (!row.appoint_date) return false;
	    const date = new Date(row.appoint_date);
	    return date.getFullYear() === year && date.getMonth() === month;
	});
		// Converte os dados do hook para o formato esperado pelas colunas
	const tableData = filteredData.map(row => ({
		id: row.id,
		appoint_date: row.appoint_date,
		total_minutes: row.total_minutes,
		is_approved: row.is_approved,
		project: row.project,
		children: row.children?.map(child => ({
			id: child.id,
			appoint_date: child.appoint_date,
			total_minutes: child.total_minutes,
			is_approved: child.is_approved,
			project: child.project,
			// Campos extras para TicketHour (se necessário)
			minutes: child.total_minutes,
			ticket_id: child.id,
			appoint_start: child.appoint_start ? new Date(child.appoint_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
			appoint_end: child.appoint_end ? new Date(child.appoint_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'
		}))
	}))

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
                    />                </div>                <div className="w-full max-w-full">                    <DataTable
                        columns={columns as never}
                        data={tableData as never}
                        meta={{ expanded, setExpanded }}
                    />
                    {loading && <div className="text-center mt-4">Carregando...</div>}
                </div>
            </div>
        </Card>
	)
}

export default TimeSheetManagementPage