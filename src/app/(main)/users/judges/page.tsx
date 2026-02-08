'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { useJudges, type UserListItem } from '@/hooks/use-judges'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteUser, createFavorite, deleteFavorite, getFavorites, type Favorite } from '@/lib/auth-api'
import { Eye, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Select } from '@/components/ui/select'

export default function UsersJudgesPage() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites' | 'non-favorites'>('all')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)

  const { data, isLoading, isError, error, isFetching } = useJudges({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  })

  // Fetch favorites to check which judges are favorited
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites', 'judge'],
    queryFn: () => getFavorites('judge'),
  })

  const favorites = favoritesData?.data ?? []
  const favoriteIds = new Set(favorites.map((f: Favorite) => f.favoriteId))

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleFavoriteFilterChange = useCallback((value: string) => {
    setFavoriteFilter(value as 'all' | 'favorites' | 'non-favorites')
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judges'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      setDeleteTarget(null)
      toast.success('Judge deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to delete judge')
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: ({ favoriteId, isFavorite }: { favoriteId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        const favorite = favorites.find((f: Favorite) => f.favoriteId === favoriteId)
        if (!favorite) throw new Error('Favorite not found')
        return deleteFavorite(favorite.id)
      }
      return createFavorite('judge', favoriteId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(variables.isFavorite ? 'Removed from favorites' : 'Added to favorites')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to update favorite')
    },
  })

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
  }, [deleteTarget, deleteMutation])

  const handleToggleFavorite = useCallback(
    (judgeId: string) => {
      const isFavorite = favoriteIds.has(judgeId)
      favoriteMutation.mutate({ favoriteId: judgeId, isFavorite })
    },
    [favoriteIds, favoriteMutation]
  )

  // Extract judges and pagination from response
  const judgesRaw = data?.data
  const allJudges = Array.isArray(judgesRaw) ? judgesRaw : []
  
  // Filter by favorite status
  const filteredJudges = useMemo(() => {
    if (favoriteFilter === 'all') return allJudges
    if (favoriteFilter === 'favorites') {
      return allJudges.filter((judge) => favoriteIds.has(judge.id))
    }
    // non-favorites
    return allJudges.filter((judge) => !favoriteIds.has(judge.id))
  }, [allJudges, favoriteFilter, favoriteIds])
  
  const judges = filteredJudges
  const totalCount = favoriteFilter === 'all' ? (data?.pagination?.total ?? 0) : filteredJudges.length

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load judges')
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
          const isFavorite = favoriteIds.has(row.id)
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleToggleFavorite(row.id)}
                className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`size-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/judges/${row.id}`} title="View">
                  <Eye className="size-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/judges/${row.id}/edit`} title="Edit">
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
    [favoriteIds, handleToggleFavorite]
  )

  return (
    <div>
      <PageHeader title="Judges" description="View and manage judge accounts.">
        <Button variant="default" asChild>
          <Link href="/users/judges/add">Add Judge</Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="favorite-filter" className="text-sm font-medium text-muted-foreground">
            Filter:
          </label>
          <Select
            id="favorite-filter"
            value={favoriteFilter}
            onChange={(e) => handleFavoriteFilterChange(e.target.value)}
            className="w-40"
          >
            <option value="all">All Judges</option>
            <option value="favorites">Favorites Only</option>
            <option value="non-favorites">Non-Favorites</option>
          </Select>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete judge"
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
        key={`judges-${judges.length}-${totalCount}`}
        columns={columns}
        data={judges}
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
          isLoading ? 'Loading...' : isFetching && search ? 'Searching...' : 'No judges found.'
        }
      />
    </div>
  )
}
