'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/data-table'
import { useSponsors, type UserListItem } from '@/hooks/use-sponsors'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteUser, createFavorite, deleteFavorite, getFavorites, type Favorite } from '@/lib/auth-api'
import { Eye, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Select } from '@/components/ui/select'

export default function UsersSponsorsPage() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [search, setSearch] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites' | 'non-favorites'>('all')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)

  const { data, isLoading, isError, error, isFetching } = useSponsors({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  })

  // Fetch favorites to check which sponsors are favorited
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites', 'sponsor'],
    queryFn: () => getFavorites('sponsor'),
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
      queryClient.invalidateQueries({ queryKey: ['sponsors'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      setDeleteTarget(null)
      toast.success('Sponsor deleted successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to delete sponsor')
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: ({ favoriteId, isFavorite }: { favoriteId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        const favorite = favorites.find((f: Favorite) => f.favoriteId === favoriteId)
        if (!favorite) throw new Error('Favorite not found')
        return deleteFavorite(favorite.id)
      }
      return createFavorite('sponsor', favoriteId)
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
    (sponsorId: string) => {
      const isFavorite = favoriteIds.has(sponsorId)
      favoriteMutation.mutate({ favoriteId: sponsorId, isFavorite })
    },
    [favoriteIds, favoriteMutation]
  )

  // Extract sponsors and pagination from response
  const sponsorsRaw = data?.data
  const allSponsors = Array.isArray(sponsorsRaw) ? sponsorsRaw : []
  
  // Filter by favorite status
  const filteredSponsors = useMemo(() => {
    if (favoriteFilter === 'all') return allSponsors
    if (favoriteFilter === 'favorites') {
      return allSponsors.filter((sponsor) => favoriteIds.has(sponsor.id))
    }
    // non-favorites
    return allSponsors.filter((sponsor) => !favoriteIds.has(sponsor.id))
  }, [allSponsors, favoriteFilter, favoriteIds])
  
  const sponsors = filteredSponsors
  const totalCount = favoriteFilter === 'all' ? (data?.pagination?.total ?? 0) : filteredSponsors.length

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load sponsors')
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
                <Link href={`/users/sponsors/${row.id}`} title="View">
                  <Eye className="size-3.5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={`/users/sponsors/${row.id}/edit`} title="Edit">
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
      <PageHeader title="Sponsors" description="View and manage sponsor accounts.">
        <Button variant="default" asChild>
          <Link href="/users/sponsors/add">Add Sponsor</Link>
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
            <option value="all">All Sponsors</option>
            <option value="favorites">Favorites Only</option>
            <option value="non-favorites">Non-Favorites</option>
          </Select>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete sponsor"
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
        key={`sponsors-${sponsors.length}-${totalCount}`}
        columns={columns}
        data={sponsors}
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
          isLoading ? 'Loading...' : isFetching && search ? 'Searching...' : 'No sponsors found.'
        }
      />
    </div>
  )
}
