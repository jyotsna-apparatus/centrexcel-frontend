'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { useParticipants, type UserListItem } from '@/hooks/use-participants'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteUser } from '@/lib/auth-api'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersParticipantsPage() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)

  const { data, isLoading, isError, error, isFetching, isPlaceholderData } = useParticipants({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      setDeleteTarget(null)
      toast.success('Participant deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to delete participant')
    },
  })

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
  }, [deleteTarget, deleteMutation])

  // Extract participants and pagination from response
  // data structure: { data: UserListItem[], pagination: {...} }
  const participantsRaw = data?.data
  const participants = Array.isArray(participantsRaw) ? participantsRaw : []
  const totalCount = data?.pagination?.total ?? 0

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load participants')
    }
  }, [isError, error])

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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/participants/${row.id}`} title="View">
                  <Eye className="size-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/participants/${row.id}/edit`} title="Edit">
                  <Pencil className="size-3.5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => setDeleteTarget({ id: row.id, email: row.email })}
                title="Delete"
              >
                <Trash2 className="size-3.5" />
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

      <PageHeader title="Participants" description="View and manage participant accounts.">
        <Button variant="default" asChild>
          <Link href="/users/participants/add">Add Participant</Link>
        </Button>
      </PageHeader>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete participant"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.email}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />

      <DataTable<UserListItem>
        key={`participants-${participants.length}-${totalCount}`}
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
        emptyMessage={
          isLoading ? 'Loading...' : isFetching && search ? 'Searching...' : 'No participants found.'
        }
      />
    </div>
  )
}
