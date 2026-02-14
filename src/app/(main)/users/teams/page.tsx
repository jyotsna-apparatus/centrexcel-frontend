'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { useTeams, type TeamListItem } from '@/hooks/use-teams'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteTeam } from '@/lib/auth-api'
import { useAuth } from '@/contexts/auth-context'
import { Eye, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function UsersTeamsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'admin'
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading, isError, error, isFetching } = useTeams({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setDeleteTarget(null)
      toast.success('Team deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to delete team')
    },
  })

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
  }, [deleteTarget, deleteMutation])

  // Extract teams and pagination from response
  const teamsRaw = data?.data
  const teams = Array.isArray(teamsRaw) ? teamsRaw : []
  const totalCount = data?.pagination?.total ?? 0

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load teams')
    }
  }, [isError, error])

  const columns = useMemo<ColumnDef<TeamListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Team Name',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        accessorKey: 'hackathon',
        header: 'Hackathon',
        cell: (info) => {
          const hackathon = info.getValue() as { id: string; title: string } | undefined
          return hackathon?.title ?? '—'
        },
      },
      {
        id: 'members',
        header: 'Members',
        cell: (info) => {
          const team = info.row.original
          const memberCount = team.members?.length ?? 0
          return (
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span>{memberCount}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'inviteCode',
        header: 'Invite Code',
        cell: (info) => {
          const code = info.getValue() as string
          return (
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{code}</code>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
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
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const team = info.row.original
          if (team.isDissolved) {
            return <span className="text-red-500">Dissolved</span>
          }
          if (team.deletionRequestedAt) {
            return <span className="text-amber-500">Deletion Pending</span>
          }
          return <span className="text-emerald-500">Active</span>
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
                <Link href={`/users/teams/${row.id}`} title="View">
                  <Eye className="size-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/teams/${row.id}`} title="Edit / Manage team">
                  <Pencil className="size-3.5" />
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                  title="Delete"
                  disabled={row.isDissolved}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
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
        title="Teams"
        description={isAdmin ? 'View and manage teams.' : 'View and manage your teams.'}
      >
        {isAdmin && (
          <Button variant="default" asChild>
            <Link href="/users/teams/add">Add Team</Link>
          </Button>
        )}
      </PageHeader>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete team"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />

      <DataTable<TeamListItem>
        key={`teams-${teams.length}-${totalCount}`}
        columns={columns}
        data={teams}
        searchMode="dynamic"
        dynamicSearchConfig={{
          searchValue: search,
          onSearch: handleSearch,
          placeholder: 'Search by team name...',
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
          isLoading ? 'Loading...' : isFetching && search ? 'Searching...' : 'No teams found.'
        }
      />
    </div>
  )
}
