"use client"

import React from "react"
import { useCallback } from "react"
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
  Updater,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ColumnVisibilityToggle } from "@/components/ui/column-visibility-toggle"
import { NestedDataTable } from "./nested-data-table"
// import { ChevronDown, ChevronRight } from 'lucide-react';

interface DataTableProps<TData extends { id?: number|string }, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: Record<string, unknown> & {
    childTable?: (children: TData[]) => React.ReactNode
    childColumns?: ColumnDef<TData, unknown>[]
    showUserInChildren?: boolean
    expanded?: Record<string, boolean>
    setExpanded?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
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
  // Props para controle externo de visibilidade das colunas
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  // Props para controle de paginação
  showPagination?: boolean
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
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  showPagination = true,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [sorting, setSorting] = useState<SortingState>([
    // { id: "projectExtId", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Usar visibilidade externa se fornecida, senão usar interna
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;

  // Função para lidar com mudanças de visibilidade que funciona com React Table
  const handleColumnVisibilityChange = useCallback((updaterOrValue: Updater<VisibilityState>) => {
    const newVisibility = typeof updaterOrValue === 'function' 
      ? updaterOrValue(columnVisibility) 
      : updaterOrValue;
    
    if (externalOnColumnVisibilityChange) {
      externalOnColumnVisibilityChange(newVisibility);
    } else {
      setInternalColumnVisibility(newVisibility);
    }
  }, [columnVisibility, externalOnColumnVisibilityChange]);

  // Só ativa seleção se receber onSelectionChange e se as colunas incluírem a coluna 'select'
  const enableRowSelection = !!onSelectionChange && columns.some(col => col.id === "select");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
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
              table.getRowModel().rows.map((row) => {
                const isExpanded = expanded && expanded[row.original.id as string];
                const hasChildren = row.original.children && row.original.children.length > 0;
                
                return [
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`
                      transition-colors duration-200
                      ${onRowClick ? "cursor-pointer hover:bg-secondary/20" : ""}
                      ${isExpanded && hasChildren ? "bg-primary/10 dark:bg-primary/5 border-primary/20 dark:border-primary/10 shadow-sm" : ""}
                    `.trim()}
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
                  isExpanded && hasChildren ? (
                    <TableRow key={`${row.id}-children`} className="bg-muted/40 dark:bg-muted/10 border-none">
                      <TableCell colSpan={columns.length} className="py-3 px-2 bg-muted/5 dark:bg-muted/5">
                        {meta?.childColumns && row.original.children ? (
                          <NestedDataTable
                            columns={meta.childColumns}
                            data={row.original.children}
                            className="mx-1"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            Nenhuma coluna configurada para dados aninhados
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : null
                ];
              })
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
      {showPagination && (
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
      )}
    </div>
  )
}