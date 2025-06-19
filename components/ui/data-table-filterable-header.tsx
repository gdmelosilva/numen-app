"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons"
import { Column } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

interface DataTableFilterableHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  onFilterChange?: (value: string) => void
  placeholder?: string
  type?: "text" | "date"
}

export function DataTableFilterableHeader<TData, TValue>({
  column,
  title,
  className,
  onFilterChange,
  placeholder,
  type = "text",
}: Readonly<DataTableFilterableHeaderProps<TData, TValue>>) {
  const [filterValue, setFilterValue] = useState<string>("")

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange?.(filterValue)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeout)
  }, [filterValue, onFilterChange])

  const sortingOptions = column.getCanSort() ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <span>{title}</span>
          {(() => {
            if (column.getIsSorted() === "desc") {
              return <ArrowDownIcon className="ml-2 h-4 w-4" />
            }
            if (column.getIsSorted() === "asc") {
              return <ArrowUpIcon className="ml-2 h-4 w-4" />
            }
            return <CaretSortIcon className="ml-2 h-4 w-4" />
          })()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
          <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="font-medium">{title}</div>
  )

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {sortingOptions}
      <Input
        type={type}
        placeholder={placeholder ?? `Filtrar ${title.toLowerCase()}...`}
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        className="h-8 w-full"
      />
    </div>
  )
}
