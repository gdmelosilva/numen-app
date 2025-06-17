"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { TimesheetSidebar } from '@/components/TimesheetSidebar'
import { useTicketHoursManagement } from '@/hooks/useTicketHoursManagement'
import { columns, TimesheetRow } from './columns'

const TimeSheetManagementPage = () => {
	const { data, loading } = useTicketHoursManagement()

	// Estado para ano e mês
	const today = new Date()
	const [year, setYear] = useState(today.getFullYear())
	const [month, setMonth] = useState(today.getMonth())

	// Funções de callback para sidebar
	const handleYearChange = (y: number) => setYear(y)
	const handleMonthChange = (m: number) => setMonth(m)
	const handleAccept = () => {/* ação de aceite */}
	const handleFilter = () => {/* ação de filtro */}
	const handleReprocess = () => {/* ação de reprocessamento */}

	// Dados para indicadores (exemplo, ajuste conforme dados reais)
	const lastUpdate = `${today.toLocaleDateString()} | ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
	const estimatedHours = 20 // Substitua por cálculo real
	const launchedDays = data.length
	const workedMinutes = data.reduce((acc, row) => acc + (row.total_minutes || 0), 0)
	const workedHours = `${String(Math.floor(workedMinutes / 60)).padStart(2, '0')}:${String(workedMinutes % 60).padStart(2, '0')}`
	const statusHours = workedHours // Substitua por cálculo real de status

	// Adiciona o campo id para cada linha (usando appoint_date + is_approved)
	const tableData: TimesheetRow[] = data.map((row) => ({
		...row,
		id: `${row.appoint_date}|${row.is_approved}`,
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
                    />
                </div>
                <div className="w-full max-w-full">
                    <DataTable columns={columns} data={tableData} />
                    {loading && <div className="text-center mt-4">Carregando...</div>}
                </div>
                {/* <Card className="flex-1 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6">
                </Card> */}
            </div>
        </Card>
	)
}

export default TimeSheetManagementPage