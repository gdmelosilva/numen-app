"use client"

import React from "react"
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
  VisibilityState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ColumnVisibilityToggle } from "@/components/ui/column-visibility-toggle"
// import { ChevronDown, ChevronRight } from 'lucide-react';

interface DataTableProps<TData extends { id?: number|string }, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown> & {
    childTable?: (children: TData[]) => React.ReactNode
    showUserInChildren?: boolean
    user?: {
      id: string
      role: number
      is_client: boolean
    }
  }
  onSelectionChange?: (ids: (number|string)[]) => void
  onRowClick?: (row: TData) => void
  showColumnVisibility?: boolean
  columnLabels?: Record<string, string>
}

export function DataTable<
  TData extends {
    id?: number | string
    children?: TData[]
    project?: { projectName?: string }
    ticket_id?: string | number
    ticket_title?: string
    ticket_type_id?: number
    ticket_external_id?: string
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
  showColumnVisibility = false,
  columnLabels = {},
}: Readonly<DataTableProps<TData, TValue>>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "projectExtId", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
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
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
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
      {showColumnVisibility && (
        <div className="flex items-center pb-4">
          <ColumnVisibilityToggle table={table} columnLabels={columnLabels} />
        </div>
      )}
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
                  <TableRow key={`${row.id}-children`} className="bg-muted/40">
                    <TableCell />
                    <TableCell colSpan={columns.length - 1} className="py-2">
                      <div className="space-y-2">
                        {row.original.children.map((child) => {
                          // Função para renderizar o título do ticket como link para administradores
                          const renderTicketTitle = (ticketId: string, projectId: string, ticketTitle: string, ticketTypeId: number, ticketExternalId: string) => {
                            // Apenas administradores (role 1) não-clientes podem ver o link
                            if (meta?.user && !meta.user.is_client && meta.user.role === 1) {
                              let ticketLink: string;
                              
                              // Tipo 1 = smartcare, Tipo 2 = smartbuild
                              if (ticketTypeId === 1) {
                                ticketLink = `/main/smartcare/management/${ticketExternalId}`;
                              } else if (ticketTypeId === 2) {
                                ticketLink = `/main/smartbuild/${projectId}/${ticketId}`;
                              } else {
                                // Default para smartbuild se tipo não reconhecido
                                ticketLink = `/main/smartbuild/${projectId}/${ticketId}`;
                              }
                              
                              return (
                                <Link 
                                  href={ticketLink}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {ticketTitle}
                                </Link>
                              );
                            }
                            return ticketTitle;
                          };

                          const childData = child as { ticket_id?: string; project_id?: string; ticket_type_id?: number; ticket_external_id?: string };
                          const isClient = meta?.user?.is_client;
                          
                          // Função para converter minutos para formato hh:mm h
                          const formatMinutesToHours = (minutes: number) => {
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} h`;
                          };
                          
                          return (
                            <div key={child.id} className="flex flex-col md:flex-row md:gap-8 text-xs md:text-sm border-l-2 border-muted pl-4">
                              <span><b>Projeto:</b> {child.project?.projectName || '-'}</span>
                              <span className="max-w-xs"><b>Ticket:</b> <span className="truncate inline-block max-w-[200px]" title={child.ticket_title || '-'}>{
                                childData.ticket_id && childData.project_id && child.ticket_title && childData.ticket_type_id && childData.ticket_external_id
                                  ? renderTicketTitle(String(childData.ticket_id), String(childData.project_id), String(child.ticket_title), childData.ticket_type_id, String(childData.ticket_external_id))
                                  : (child.ticket_title || '-')
                              }</span></span>
                              <span><b>Horas:</b> {formatMinutesToHours(child.minutes || 0)}</span>
                              {!isClient && <span><b>Início:</b> {child.appoint_start || '-'}</span>}
                              {!isClient && <span><b>Fim:</b> {child.appoint_end || '-'}</span>}
                              {/* Mostrar usuário apenas para administradores (role 1) não-clientes */}
                              {meta?.showUserInChildren && 'user_name' in child && child.user_name ? (
                                <span><b>Usuário:</b> {String(child.user_name)}</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
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