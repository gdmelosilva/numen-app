"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { useTicketHoursManagement } from '@/hooks/useTicketHoursManagement'
import { columns, TimesheetRow } from './columns'

const TimeSheetManagementPage = () => {
	const { data, loading } = useTicketHoursManagement()

	// Adiciona o campo id para cada linha (usando appoint_date + is_approved)
	const tableData: TimesheetRow[] = data.map((row) => ({
		...row,
		id: `${row.appoint_date}|${row.is_approved}`,
	}))

	return (
		<Card className="w-full max-w-3xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 mt-32 p-6">
			<h1 className="text-2xl font-bold mb-6 text-center">
				Gestão de Apontamentos
			</h1>
			<DataTable columns={columns} data={tableData} />
			{loading && <div className="text-center mt-4">Carregando...</div>}
		</Card>
	)
}

export default TimeSheetManagementPage