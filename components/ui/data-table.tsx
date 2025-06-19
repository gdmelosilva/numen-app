"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
// import { ChevronDown, ChevronRight } from 'lucide-react';

interface DataTableProps<TData extends { id?: number|string }, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown>
  onSelectionChange?: (ids: (number|string)[]) => void
  onRowClick?: (row: TData) => void
}

export function DataTable<
  TData extends {
    id?: number | string
    children?: TData[]
    project?: { projectName?: string }
    ticket_id?: string | number
    minutes?: number
    appoint_start?: string
    appoint_end?: string
  },
  TValue
>({
  columns,
  data,
  meta,
  onSelectionChange,
  onRowClick,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "projectExtId", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Só ativa seleção se receber onSelectionChange e se as colunas incluírem a coluna 'select'
  const enableRowSelection = !!onSelectionChange && columns.some(col => col.id === "select");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    meta,
  })

  useEffect(() => {
    if (enableRowSelection && onSelectionChange) {
      const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id).filter(id => id !== undefined)
      onSelectionChange(selectedIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  // Treeview: expanded state
  const expanded = meta?.expanded as Record<string, boolean> | undefined;

  return (
    <div>
      <div className="rounded-md border bg-card shadow-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => [
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-accent" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>,
                // Renderiza filhos se expandido
                expanded && expanded[row.original.id as string] && row.original.children && row.original.children.length > 0 ? (
                  row.original.children.map((child) => (
                    <TableRow key={child.id} className="bg-muted/40">
                      <TableCell />
                      <TableCell colSpan={columns.length - 1} className="py-2">
                        <div className="flex flex-col md:flex-row md:gap-8 text-xs md:text-sm">
                          <span><b>Projeto:</b> {child.project?.projectName || '-'}</span>
                          <span><b>Ticket:</b> {child.ticket_id || '-'}</span>
                          <span><b>Horas:</b> {((child.minutes || 0) / 60).toFixed(2)}h</span>
                          <span><b>Início:</b> {child.appoint_start || '-'}</span>
                          <span><b>Fim:</b> {child.appoint_end || '-'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : null
              ])
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}