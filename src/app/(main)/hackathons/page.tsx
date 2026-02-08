'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useHackathons, type HackathonListItem } from '@/hooks/use-hackathons'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonsPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError, error, isFetching } = useHackathons({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
    status: statusFilter || undefined,
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const hackathonsRaw = data?.data
  const hackathons = Array.isArray(hackathonsRaw) ? hackathonsRaw : []
  const totalCount = data?.pagination?.total ?? 0

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load hackathons')
    }
  }, [isError, error])

  const columns = useMemo<ColumnDef<HackathonListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        accessorKey: 'shortDescription',
        header: 'Description',
        cell: (info) => {
          const val = info.getValue() as string
          return val ? (val.length > 80 ? `${val.slice(0, 80)}…` : val) : '—'
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          const label = HACKATHON_STATUS_LABELS[status] ?? status ?? '—'
          const color =
            status === 'open'
              ? 'text-emerald-600'
              : status === 'submission_closed'
                ? 'text-amber-600'
                : status === 'closed'
                  ? 'text-muted-foreground'
                  : 'text-red-600'
          return <span className={color}>{label}</span>
        },
      },
      {
        accessorKey: 'submissionDeadline',
        header: 'Submission deadline',
        cell: (info) => {
          const raw = info.getValue() as string
          if (!raw) return '—'
          try {
            return new Date(raw).toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          } catch {
            return raw
          }
        },
      },
      {
        id: 'counts',
        header: 'Entries / Teams',
        cell: (info) => {
          const row = info.row.original
          const sub = row._count?.submissions ?? '—'
          const teams = row._count?.teams ?? '—'
          return (
            <span className="text-muted-foreground">
              {sub} / {teams}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/hackathons/${row.id}`} title="View">
                  <Eye className="size-3.5" />
                </Link>
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div>
      <PageHeader
        title="Hackathons"
        description="Browse and manage hackathon events."
      >
        <Button variant="default" asChild>
          <Link href="/hackathons/new">
            
            Create hackathon
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          className="w-[180px]"
        >
          <option value="">All statuses</option>
          {Object.entries(HACKATHON_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable<HackathonListItem>
        key={`hackathons-${hackathons.length}-${totalCount}`}
        columns={columns}
        data={hackathons}
        searchMode="dynamic"
        dynamicSearchConfig={{
          searchValue: search,
          onSearch: handleSearch,
          placeholder: 'Search by title or description...',
          debounceMs: 300,
        }}
        pagination
        paginationConfig={{
          pageSize: pagination.pageSize,
          pageSizeOptions: [5, 10, 20, 50],
          totalCount,
        }}
        paginationState={pagination}
        onPaginationChange={setPagination}
        sorting={false}
        getRowId={(row) => row.id}
        emptyMessage={
          isLoading
            ? 'Loading...'
            : isFetching && search
              ? 'Searching...'
              : 'No hackathons found.'
        }
      />
    </div>
  )
}
