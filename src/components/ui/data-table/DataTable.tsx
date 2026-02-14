"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type RowData,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type DataTableProps,
  type DynamicSearchConfig,
  type SearchMode,
} from "./types"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

function useDebounce<T>(value: T, delayMs: number | undefined): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)
  React.useEffect(() => {
    if (delayMs == null || delayMs <= 0) {
      setDebouncedValue(value)
      return
    }
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debouncedValue
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchMode = "client",
  dynamicSearchConfig,
  searchPlaceholder = "Search...",
  pagination = true,
  paginationConfig = {},
  paginationState: controlledPaginationState,
  onPaginationChange,
  sorting = true,
  sortingConfig,
  sortingState: controlledSortingState,
  getRowId,
  className,
  emptyMessage = "No results.",
  responsiveCardLayout = true,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [uncontrolledPagination, setUncontrolledPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: paginationConfig?.pageSize ?? DEFAULT_PAGE_SIZE,
    })
  const [uncontrolledSorting, setUncontrolledSorting] =
    React.useState<SortingState>(sortingConfig?.initialSorting ?? [])

  const isServerPagination = onPaginationChange != null
  const isServerSorting =
    sortingConfig?.serverSide === true && sortingConfig?.onSortingChange != null

  const paginationState =
    controlledPaginationState ?? uncontrolledPagination
  const setPaginationState = React.useCallback(
    (updater: (prev: PaginationState) => PaginationState) => {
      const next = updater(paginationState)
      onPaginationChange?.(next)
      if (!controlledPaginationState) setUncontrolledPagination(next)
    },
    [paginationState, onPaginationChange, controlledPaginationState]
  )

  const sortingState = controlledSortingState ?? uncontrolledSorting
  const setSortingState = React.useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      const next =
        typeof updater === "function" ? updater(sortingState) : updater
      sortingConfig?.onSortingChange?.(next)
      if (!controlledSortingState) setUncontrolledSorting(next)
    },
    [sortingState, sortingConfig, controlledSortingState]
  )

  const pageSizeOptions =
    paginationConfig?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
  const totalCount = paginationConfig?.totalCount
  const pageCount =
    totalCount != null && totalCount >= 0
      ? Math.ceil(totalCount / paginationState.pageSize) || 1
      : undefined

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    state: {
      globalFilter: searchMode === "client" ? globalFilter : undefined,
      pagination: pagination ? paginationState : undefined,
      sorting: sorting ? sortingState : undefined,
    },
    onGlobalFilterChange: searchMode === "client" ? setGlobalFilter : undefined,
    onPaginationChange: pagination ? setPaginationState : undefined,
    onSortingChange: setSortingState,
    getFilteredRowModel:
      searchMode === "client" ? getFilteredRowModel() : undefined,
    getPaginationRowModel:
      pagination && !isServerPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel:
      sorting && !isServerSorting ? getSortedRowModel() : undefined,
    manualPagination: isServerPagination,
    manualSorting: isServerSorting,
    pageCount,
    manualFiltering: searchMode === "dynamic",
  })

  const rows = table.getRowModel().rows
  const canPrev = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()
  const totalRows =
    totalCount ??
    (searchMode === "client" ? table.getFilteredRowModel().rows.length : data.length)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      {(searchMode === "client" || dynamicSearchConfig) && (
        <DataTableSearch
          searchMode={searchMode}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          dynamicSearchConfig={dynamicSearchConfig}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      {/* Table: scroll wrapper + optional card layout on small screens */}
      <div className="glass cs-card w-full overflow-x-auto rounded-lg border border-cs-border">
        {responsiveCardLayout ? (
          <>
            <div className="hidden min-[640px]:block">
              <TableDesktop table={table} columns={columns} />
            </div>
            <div className="min-[640px]:hidden">
              <TableCards table={table} columns={columns} />
            </div>
          </>
        ) : (
          <TableDesktop table={table} columns={columns} />
        )}

        {rows.length === 0 && (
          <div className="flex min-h-[200px] items-center justify-center p-8 text-cs-text">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && rows.length > 0 && (
        <DataTablePagination
          table={table}
          totalRows={totalRows}
          pageSizeOptions={pageSizeOptions}
          canPrev={canPrev}
          canNext={canNext}
        />
      )}
    </div>
  )
}

function DataTableSearch({
  searchMode,
  globalFilter,
  onGlobalFilterChange,
  dynamicSearchConfig,
  searchPlaceholder,
}: {
  searchMode: SearchMode
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  dynamicSearchConfig?: DynamicSearchConfig
  searchPlaceholder: string
}) {
  const dynamicValue = dynamicSearchConfig?.searchValue ?? ""
  const dynamicOnSearch = dynamicSearchConfig?.onSearch
  const debounceMs = dynamicSearchConfig?.debounceMs ?? 300
  const [localDynamicValue, setLocalDynamicValue] = React.useState(dynamicValue)
  const debouncedDynamic = useDebounce(localDynamicValue, debounceMs)

  React.useEffect(() => {
    if (searchMode === "dynamic" && dynamicOnSearch) {
      dynamicOnSearch(debouncedDynamic)
    }
  }, [debouncedDynamic, searchMode, dynamicOnSearch])

  React.useEffect(() => {
    setLocalDynamicValue(dynamicValue)
  }, [dynamicValue])

  const placeholder =
    searchMode === "dynamic"
      ? dynamicSearchConfig?.placeholder ?? searchPlaceholder
      : searchPlaceholder

  if (searchMode === "client") {
    return (
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder={placeholder}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="pl-9"
        />
      </div>
    )
  }

  return (
    <div className="relative max-w-sm">
      <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        placeholder={placeholder}
        value={localDynamicValue}
        onChange={(e) => setLocalDynamicValue(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}

function TableDesktop<TData extends RowData>({
  table,
  columns,
}: {
  table: ReturnType<typeof useReactTable<TData>>
  columns: ColumnDef<TData, unknown>[]
}) {
  return (
    <table className="w-full min-w-[640px] caption-bottom text-sm">
      <thead className=" ">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-cs-border ">
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className=" h-12 px-4 text-left font-medium !bg-gradient-to-b from-cs-primary to-cs-secondary"
              >
                <SortableHeader header={header} />
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-cs-border transition-colors hover:bg-white/10 hover:cursor-pointer "
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SortableHeader({ header }: { header: { column: { getCanSort: () => boolean; getToggleSortingHandler: () => ((e: unknown) => void) | undefined; getIsSorted: () => false | "asc" | "desc" } } }) {
  const canSort = header.column.getCanSort()
  const sorted = header.column.getIsSorted()
  const toggle = header.column.getToggleSortingHandler()

  if (!canSort) {
    return (
      <span className="!text-cs-black [&_svg]:brightness-0">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
    )
  }

  return (
    <button
      type="button"
      className="flex items-center !text-cs-black gap-1 hover:text-foreground"
      onClick={toggle}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {sorted === "asc" ? (
        <ChevronUp className="size-4" />
      ) : sorted === "desc" ? (
        <ChevronDown className="size-4" />
      ) : (
        <ChevronsUpDown className="brightness-0 size-4" />
      )}
    </button>
  )
}

function TableCards<TData extends RowData>({
  table,
  columns,
}: {
  table: ReturnType<typeof useReactTable<TData>>
  columns: ColumnDef<TData, unknown>[]
}) {
  const headers = table.getHeaderGroups()[0]?.headers ?? []
  return (
    <div className="divide-y divide-cs-border p-2">
      {table.getRowModel().rows.map((row) => (
        <div
          key={row.id}
          className="space-y-2 rounded-md border border-cs-border bg-cs-card/50 p-3"
        >
          {row.getVisibleCells().map((cell, i) => {
            const colHeader = headers[i]
            const label = colHeader
              ? flexRender(
                  colHeader.column.columnDef.header,
                  colHeader.getContext()
                )
              : null
            return (
              <div key={cell.id} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">
                  {label}
                </span>
                <span className="text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DataTablePagination({
  table,
  totalRows,
  pageSizeOptions,
  canPrev,
  canNext,
}: {
  table: ReturnType<typeof useReactTable<RowData>>
  totalRows: number
  pageSizeOptions: number[]
  canPrev: boolean
  canNext: boolean
}) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        Showing {start}–{end} of {totalRows}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground whitespace-nowrap text-sm">
            Rows per page
          </span>
          <select
            className="border-cs-border bg-cs-card h-9 rounded-md border px-2 text-sm"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
