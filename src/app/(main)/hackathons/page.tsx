'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useHackathons, type HackathonListItem } from '@/hooks/use-hackathons'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { useAuth } from '@/contexts/auth-context'
import { Eye, Plus, UserPlus, Calendar, Users, FileUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 300
const PAGE_SIZE = 12

function useDebouncedSearch(initialValue: string, delayMs: number) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return [value, debouncedValue, setValue] as const
}

function StatusBadge({ status }: { status: string }) {
  const label = HACKATHON_STATUS_LABELS[status] ?? status
  const className =
    status === 'open'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : status === 'submission_closed'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
        : status === 'closed'
          ? 'bg-muted text-muted-foreground'
          : 'bg-red-500/15 text-red-700 dark:text-red-400'
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  )
}

export default function HackathonsPage() {
  const { user } = useAuth()
  const isParticipant = user?.role === 'participant'
  const isAdmin = user?.role === 'admin'

  const [pageIndex, setPageIndex] = useState(0)
  const [searchInput, debouncedSearch, setSearchInput] = useDebouncedSearch('', DEBOUNCE_MS)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError, error, isFetching } = useHackathons({
    page: pageIndex,
    pageSize: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter || undefined,
  })

  const hackathonsRaw = data?.data
  const hackathons = Array.isArray(hackathonsRaw) ? hackathonsRaw : []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const totalCount = pagination?.total ?? 0

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setPageIndex(0)
  }, [setSearchInput])

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load hackathons')
    }
  }, [isError, error])

  return (
    <div>
      <PageHeader
        title="Hackathons"
        description="Browse and manage hackathon events."
      >
        {isAdmin && (
          <Button variant="default" asChild>
            <Link href="/hackathons/new">
              <Plus className="mr-2 size-4" />
              Create hackathon
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Input
          type="search"
          placeholder="Search by title or description..."
          value={searchInput}
          onChange={handleSearchChange}
          className="max-w-xs"
          aria-label="Search hackathons"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPageIndex(0)
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-lg border border-cs-border bg-card"
            />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card py-16 text-center">
          <p className="text-muted-foreground">
            {isFetching && debouncedSearch ? 'Searching...' : 'No hackathons found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="flex flex-col rounded-lg border border-cs-border bg-card shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-cs-heading line-clamp-2">
                      {hackathon.title}
                    </h3>
                    <StatusBadge status={hackathon.status} />
                  </div>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {hackathon.shortDescription || '—'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {hackathon.submissionDeadline
                        ? new Date(hackathon.submissionDeadline).toLocaleDateString(undefined, {
                            dateStyle: 'short',
                          })
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileUp className="size-3.5" />
                      {hackathon._count?.submissions ?? 0} entries
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {hackathon._count?.teams ?? 0} teams
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-cs-border p-4">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/hackathons/${hackathon.id}`}>
                      <Eye className="mr-1.5 size-4" />
                      View
                    </Link>
                  </Button>
                  {isParticipant && (
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <Link href={`/hackathons/${hackathon.id}/apply`}>
                        <UserPlus className="mr-1.5 size-4" />
                        Apply
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0 || isFetching}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex >= totalPages - 1 || isFetching}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
