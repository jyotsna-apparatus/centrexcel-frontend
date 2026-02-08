import type {
  ColumnDef,
  PaginationState,
  SortingState,
  RowData,
} from "@tanstack/react-table"

export type { ColumnDef, PaginationState, SortingState, RowData }

/** Search mode: client-side filters in-memory data; dynamic uses server/API with onSearch */
export type SearchMode = "client" | "dynamic"

export interface DynamicSearchConfig {
  /** Current search value (controlled) */
  searchValue: string
  /** Called when user types (e.g. debounced fetch) */
  onSearch: (value: string) => void
  /** Placeholder for search input */
  placeholder?: string
  /** Debounce ms when using dynamic search (optional, parent can debounce in onSearch) */
  debounceMs?: number
}

export interface DataTablePaginationConfig {
  /** Initial page size */
  pageSize?: number
  /** Page size options for selector */
  pageSizeOptions?: number[]
  /** Total row count for server-side pagination (when using dynamic) */
  totalCount?: number
}

export interface DataTableSortingConfig<TData extends RowData> {
  /** Initial sorting state */
  initialSorting?: SortingState
  /** For server-side sorting: called when sort changes so parent can refetch */
  onSortingChange?: (sorting: SortingState) => void
  /** When true, sorting is handled by the server (manualSorting) */
  serverSide?: boolean
}

export interface DataTableProps<TData extends RowData> {
  /** Column definitions */
  columns: ColumnDef<TData, unknown>[]
  /** Data rows (for client-side) or current page rows (for server-side) */
  data: TData[]
  /** Search mode: client (filter in memory) or dynamic (use onSearch) */
  searchMode?: SearchMode
  /** Required when searchMode is "dynamic" */
  dynamicSearchConfig?: DynamicSearchConfig
  /** Search input placeholder when searchMode is "client" */
  searchPlaceholder?: string
  /** Enable pagination (default true) */
  pagination?: boolean
  /** Pagination options */
  paginationConfig?: DataTablePaginationConfig
  /** For server-side: current pagination state is controlled by parent */
  paginationState?: PaginationState
  /** Called when pagination state changes (for server-side) */
  onPaginationChange?: (state: PaginationState) => void
  /** Enable sorting (default true) */
  sorting?: boolean
  /** Sorting options (including server-side) */
  sortingConfig?: DataTableSortingConfig<TData>
  /** Current sorting state (controlled, for server-side) */
  sortingState?: SortingState
  /** Unique row id accessor for React keys */
  getRowId?: (row: TData) => string
  /** Optional class for the table wrapper */
  className?: string
  /** Empty state message when no data */
  emptyMessage?: string
  /** Show card layout on small screens instead of horizontal scroll (default true) */
  responsiveCardLayout?: boolean
}
