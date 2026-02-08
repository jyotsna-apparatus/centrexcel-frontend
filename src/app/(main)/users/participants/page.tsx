'use client'

import { useMemo, useState, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useParticipants, type UserListItem } from '@/hooks/use-participants'

export default function UsersParticipantsPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error } = useParticipants({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const participants = data?.data ?? []
  const totalCount = data?.pagination?.total ?? 0

  const columns = useMemo<ColumnDef<UserListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        accessorKey: 'emailVerified',
        header: 'Verified',
        cell: (info) => {
          const v = info.getValue() as boolean
          return v ? (
            <span className="text-emerald-500">Yes</span>
          ) : (
            <span className="text-amber-500">No</span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: (info) => {
          const raw = info.getValue() as string
          if (!raw) return '—'
          try {
            const d = new Date(raw)
            return d.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          } catch {
            return raw
          }
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Participants</h1>
        <p className="p1 mt-1 text-cs-text">View and manage participant accounts.</p>
      </header>

      {isError && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load participants'}
        </div>
      )}

      <DataTable<UserListItem>
        columns={columns}
        data={participants}
        searchMode="dynamic"
        dynamicSearchConfig={{
          searchValue: search,
          onSearch: handleSearch,
          placeholder: 'Search by email or username...',
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
        emptyMessage={isLoading ? 'Loading...' : 'No participants found.'}
      />
    </div>
  )
}
