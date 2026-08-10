import type React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    cell: (item: T) => React.ReactNode
    className?: string
  }[]
  className?: string
  emptyState?: React.ReactNode
  rowKey?: (item: T, index: number) => React.Key
}

export function DataTable<T>({ data, columns, className, emptyState, rowKey }: DataTableProps<T>) {
  return (
    <div className={cn("w-full", className)}>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground", column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyState || "No data available"}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={rowKey ? rowKey(item, index) : index}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column.key}`} className={cn("px-4 py-3 align-middle", column.className)}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
