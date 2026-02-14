'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useHackathons } from '@/hooks/use-hackathons'
import { useTeams } from '@/hooks/use-teams'
import PageHeader from '@/components/pageHeader/PageHeader'
import { HackathonCard } from '@/components/hackathon-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { HACKATHON_STATUS_LABELS } from '@/config/hackathon-constants'
import { useAuth } from '@/contexts/auth-context'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const DEBOUNCE_MS = 300
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
const DEFAULT_PAGE_SIZE = 12

function useDebouncedSearch(initialValue: string, delayMs: number) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return [value, debouncedValue, setValue] as const
}

export default function HackathonsPage() {
  const { user } = useAuth()
  const isParticipant = user?.role === 'participant'
  const isAdmin = user?.role === 'admin'

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchInput, debouncedSearch, setSearchInput] = useDebouncedSearch('', DEBOUNCE_MS)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError, error, isFetching } = useHackathons({
    page: pageIndex,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter || undefined,
  })

  const { data: myTeamsData } = useTeams({
    page: 0,
    pageSize: 100,
    search: '',
    hackathonId: undefined,
  })
  const allTeams = myTeamsData?.data ?? []
  const myTeams = allTeams.filter((t) =>
    t.members?.some((m) => m.userId === user?.id)
  )
  const teamByHackathonId = useMemo(() => {
    const map: Record<string, { id: string }> = {}
    for (const team of myTeams) {
      for (const p of team.participations ?? []) {
        if (p.hackathon?.id && !map[p.hackathon.id]) {
          map[p.hackathon.id] = { id: team.id }
        }
      }
    }
    return map
  }, [myTeams])

  const hackathonsRaw = data?.data
  const hackathons = Array.isArray(hackathonsRaw) ? hackathonsRaw : []
  const pagination = data?.pagination
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  const totalCount = pagination?.total ?? 0
  const startItem = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, totalCount)

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
              <Plus className="size-4" color="black" />
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
        <Select
          value={String(pageSize)}
          onChange={(e) => {
            setPageSize(Number(e.target.value))
            setPageIndex(0)
          }}
          className="w-[120px]"
          aria-label="Items per page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} per page
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
          <p className="text-muted-foreground mb-4">
            {isFetching && debouncedSearch ? 'Searching...' : 'No hackathons found.'}
          </p>
          {isAdmin && !isFetching && !debouncedSearch && (
            <p className="text-muted-foreground text-sm mb-4">
              Create your first hackathon to get started.
            </p>
          )}
          {isAdmin && !isFetching && (
            <Button asChild>
              <Link href="/hackathons/new">
                <Plus className="mr-2 size-4" />
                Create hackathon
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 400px))' }}>
            {hackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                variant="list"
                isAdmin={isAdmin}
                isParticipant={isParticipant}
                userTeamForHackathon={isParticipant ? (teamByHackathonId[hackathon.id] ?? null) : null}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-cs-border pt-6">
            <p className="text-sm text-muted-foreground">
              {totalCount === 0
                ? 'No hackathons'
                : `Showing ${startItem}–${endItem} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0 || isFetching}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {pageIndex + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1 || isFetching}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
