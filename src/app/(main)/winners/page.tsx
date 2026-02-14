'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHackathons } from '@/hooks/use-hackathons'
import { useHackathonWinners } from '@/hooks/use-winners'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Medal, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { canAccessPath } from '@/config/sidebar-nav'
import { toast } from 'sonner'

const POSITION_LABELS: Record<number, string> = {
  1: '1st place',
  2: '2nd place',
  3: '3rd place',
}

export default function WinnersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('')

  useEffect(() => {
    if (user?.role && !canAccessPath('/winners', user.role)) {
      router.replace('/dashboard')
    }
  }, [user?.role, router])

  const { data: hackathonsData, isLoading: loadingHackathons, isError: hackathonsError, error: hackathonsErr } = useHackathons({
    page: 0,
    pageSize: 100,
  })

  const hackathons = Array.isArray(hackathonsData?.data) ? hackathonsData.data : []
  const firstId = hackathons[0]?.id ?? ''

  useEffect(() => {
    if (selectedHackathonId === '' && firstId) {
      setSelectedHackathonId(firstId)
    }
  }, [firstId, selectedHackathonId])

  const { data: winners, isLoading: loadingWinners, isError: winnersError, error: winnersErr } = useHackathonWinners(
    selectedHackathonId || null
  )

  const winnersList = Array.isArray(winners) ? winners : []

  useEffect(() => {
    if (hackathonsError && hackathonsErr) {
      toast.error(hackathonsErr instanceof Error ? hackathonsErr.message : 'Failed to load hackathons')
    }
  }, [hackathonsError, hackathonsErr])

  useEffect(() => {
    if (winnersError && winnersErr && selectedHackathonId) {
      toast.error(winnersErr instanceof Error ? winnersErr.message : 'Failed to load winners')
    }
  }, [winnersError, winnersErr, selectedHackathonId])

  return (
    <div>
      <PageHeader
        title="Winnings"
        description="View hackathon winners and your results."
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-cs-text">Hackathon</label>
        <Select
          value={selectedHackathonId}
          onChange={(e) => setSelectedHackathonId(e.target.value)}
          className="min-w-[240px]"
        >
          <option value="">Select a hackathon</option>
          {hackathons.map((h) => (
            <option key={h.id} value={h.id}>
              {h.title}
            </option>
          ))}
        </Select>
      </div>

      {loadingHackathons && hackathons.length === 0 ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : !selectedHackathonId ? (
        <p className="text-muted-foreground">Select a hackathon to view winnings.</p>
      ) : loadingWinners ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : winnersList.length === 0 ? (
        <p className="text-muted-foreground">No winnings announced yet for this hackathon.</p>
      ) : (
        <ul className="space-y-4">
          {winnersList
            .sort((a, b) => a.position - b.position)
            .map((w) => (
              <li
                key={w.id}
                className="flex items-start gap-4 rounded-lg border border-cs-border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {w.position === 1 ? (
                    <Trophy className="size-5" />
                  ) : (
                    <Medal className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cs-heading">
                    {POSITION_LABELS[w.position] ?? `Position ${w.position}`}
                  </p>
                  <p className="mt-0.5 text-sm text-cs-text">
                    {w.submission?.title ?? 'Submission'}
                  </p>
                  {w.submission?.team?.name && (
                    <p className="text-xs text-muted-foreground">
                      Team: {w.submission.team.name}
                    </p>
                  )}
                  {w.submission?.averageScore != null && (
                    <p className="text-xs text-muted-foreground">
                      Average score: {w.submission.averageScore}
                    </p>
                  )}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
