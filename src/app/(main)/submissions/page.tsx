'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaginationState } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useSubmissions, type SubmissionListItem } from '@/hooks/use-submissions'
import PageHeader from '@/components/pageHeader/PageHeader'
import { useAuth } from '@/contexts/auth-context'
import { canAccessPath } from '@/config/sidebar-nav'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    if (user?.role && !canAccessPath('/submissions', user.role)) {
      router.replace('/dashboard')
    }
  }, [user?.role, router])

  const { data, isLoading, isError, error, isFetching } = useSubmissions({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
  })

  const submissionsRaw = data?.data
  const submissions = Array.isArray(submissionsRaw) ? submissionsRaw : []
  const totalCount = data?.pagination?.total ?? 0

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load submissions')
    }
  }, [isError, error])

  const columns = useMemo<ColumnDef<SubmissionListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (info.getValue() as string) ?? '—',
      },
      {
        id: 'hackathon',
        header: 'Hackathon',
        cell: (info) => {
          const row = info.row.original
          return row.hackathon?.title ?? '—'
        },
      },
      {
        id: 'team',
        header: 'Team',
        cell: (info) => {
          const row = info.row.original
          return row.team?.name ?? 'Solo'
        },
      },
      {
        accessorKey: 'averageScore',
        header: 'Avg score',
        cell: (info) => {
          const val = info.getValue() as number | null | undefined
          if (val == null) return '—'
          return String(val)
        },
      },
      {
        accessorKey: 'fileSize',
        header: 'Size',
        cell: (info) => {
          const val = info.getValue() as number | undefined
          if (val == null) return '—'
          return formatBytes(val)
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
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
    ],
    []
  )

  return (
    <div>
      <PageHeader
        title="Submissions"
        description="Review project submissions (your own and team submissions)."
      />

      <DataTable<SubmissionListItem>
        key={`submissions-${submissions.length}-${totalCount}`}
        columns={columns}
        data={submissions}
        searchMode="client"
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
          isLoading ? 'Loading...' : isFetching ? 'Loading...' : 'No submissions found.'
        }
      />
    </div>
  )
}
